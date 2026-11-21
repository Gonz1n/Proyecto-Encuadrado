import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { Building2, Loader2, Video } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { format, subYears } from 'date-fns'
import { ApiError } from '@/lib/api-client'
import { PHONE_ERROR, PHONE_PATTERN } from '@/lib/phone'
import { normalizeRut } from '@/lib/rut'
import { queryKeys } from '@/lib/query-keys'
import { useBookingFlow, type PatientDraft } from '../booking-context'
import { saveBooking } from '../booking-storage'
import { useCreateBooking } from '../hooks'
import { MODALITY_LABELS, type Modality } from '@/lib/modality'

const buildPatientSchema = (today: string, oldest: string) =>
  z.object({
    patient_name: z
      .string()
      .trim()
      .min(3, 'Ingresa tu nombre y apellido')
      .max(120, 'Usa como máximo 120 caracteres'),
    patient_email: z.string().trim().pipe(z.email('Ingresa un correo válido')),
    patient_phone: z.string().trim().regex(PHONE_PATTERN, PHONE_ERROR),
    patient_rut: z
      .string()
      .trim()
      .refine((value) => normalizeRut(value) !== null, 'Ingresa un RUT válido, por ejemplo 12.345.678-5'),
    patient_birth_date: z
      .string()
      .min(1, 'Ingresa tu fecha de nacimiento')
      .refine((value) => value <= today, 'La fecha de nacimiento no puede ser futura')
      .refine((value) => value >= oldest, 'Revisa la fecha de nacimiento'),
    modality: z.enum(['in_person', 'remote']),
  })

const PATIENT_FIELDS = [
  'patient_name',
  'patient_rut',
  'patient_birth_date',
  'patient_email',
  'patient_phone',
] as const

const FIELDS: {
  name: (typeof PATIENT_FIELDS)[number]
  label: string
  type: string
  autoComplete: string
  inputMode?: 'email' | 'tel'
  placeholder?: string
}[] = [
  { name: 'patient_name', label: 'Nombre y apellido', type: 'text', autoComplete: 'name' },
  { name: 'patient_rut', label: 'RUT', type: 'text', autoComplete: 'off', placeholder: '12.345.678-5' },
  {
    name: 'patient_birth_date',
    label: 'Fecha de nacimiento',
    type: 'date',
    autoComplete: 'bday',
  },
  {
    name: 'patient_email',
    label: 'Correo',
    type: 'email',
    autoComplete: 'email',
    inputMode: 'email',
    placeholder: 'nombre@correo.cl',
  },
  {
    name: 'patient_phone',
    label: 'Celular',
    type: 'tel',
    autoComplete: 'tel',
    inputMode: 'tel',
    placeholder: '+56 9 1234 5678',
  },
]

function firstMessage(data: Record<string, unknown>, key: string): string | null {
  const messages = data[key]
  return Array.isArray(messages) && messages.length > 0 ? String(messages[0]) : null
}

export function PatientStep() {
  const { slug, state, patientDraft, savePatientDraft } = useBookingFlow()
  const queryClient = useQueryClient()
  const router = useRouter()
  const today = format(new Date(), 'yyyy-MM-dd')
  const oldest = format(subYears(new Date(), 120), 'yyyy-MM-dd')
  const patientSchema = useMemo(() => buildPatientSchema(today, oldest), [today, oldest])
  const createBooking = useCreateBooking(slug)
  const {
    register,
    handleSubmit,
    setError,
    getValues,
    control,
    formState: { errors, isSubmitting },
  } = useForm<PatientDraft>({ resolver: zodResolver(patientSchema), defaultValues: patientDraft })

  useEffect(() => () => savePatientDraft(getValues()), [getValues, savePatientDraft])

  const handleError = (error: unknown) => {
    if (error instanceof ApiError && error.status === 409) {
      toast.error('Esa hora acaba de ser tomada, elige otra')
      state.update({ time: null }, { replace: true })
      return
    }
    if (error instanceof ApiError && error.status === 400 && error.data) {
      const data = error.data as Record<string, unknown>
      if (firstMessage(data, 'service')) {
        toast.error('Este servicio ya no está disponible')
        queryClient.invalidateQueries({ queryKey: queryKeys.publicCenter(slug) })
        state.update({ service: null })
        return
      }
      if (firstMessage(data, 'professional')) {
        toast.error('Este profesional ya no está disponible')
        queryClient.invalidateQueries({ queryKey: queryKeys.publicCenter(slug) })
        state.update({ professional: null })
        return
      }
      if (firstMessage(data, 'start')) {
        toast.error('Esa hora ya no está disponible, elige otra')
        state.update({ time: null }, { replace: true })
        return
      }
      let mapped = false
      for (const field of PATIENT_FIELDS) {
        const message = firstMessage(data, field)
        if (message) {
          setError(field, { message })
          mapped = true
        }
      }
      if (mapped) return
    }
    toast.error('No pudimos agendar tu hora. Intenta de nuevo.')
  }

  const onSubmit = handleSubmit(async (values) => {
    if (!state.service || !state.professional || !state.date || !state.time) return
    try {
      const booking = await createBooking.mutateAsync({
        service: state.service.id,
        professional: state.professional.id,
        start: `${state.date}T${state.time}`,
        ...values,
      })
      saveBooking(booking)
      router.replace(`/c/${slug}/agendar/listo`)
    } catch (error) {
      handleError(error)
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate className="max-w-md space-y-5">
      {FIELDS.map(({ name, label, ...input }) => {
        const error = errors[name]
        return (
          <div key={name} className="space-y-2">
            <Label htmlFor={name}>{label}</Label>
            <Input
              id={name}
              className="h-11 md:h-10"
              spellCheck={false}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${name}-error` : undefined}
              {...input}
              {...(name === 'patient_birth_date' ? { min: oldest, max: today } : {})}
              {...register(name)}
            />
            {error ? (
              <p id={`${name}-error`} className="text-sm text-destructive">
                {error.message}
              </p>
            ) : null}
          </div>
        )
      })}
      <Controller
        control={control}
        name="modality"
        render={({ field }) => (
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Modalidad de atención</legend>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(MODALITY_LABELS) as Modality[]).map((value) => {
                const Icon = value === 'remote' ? Video : Building2
                const active = field.value === value
                return (
                  <Button
                    key={value}
                    type="button"
                    variant={active ? 'default' : 'outline'}
                    aria-pressed={active}
                    className="h-11 justify-start gap-2"
                    onClick={() => field.onChange(value)}
                  >
                    <Icon aria-hidden="true" />
                    {MODALITY_LABELS[value]}
                  </Button>
                )
              })}
            </div>
          </fieldset>
        )}
      />
      <Button type="submit" size="lg" className="h-11 w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="motion-safe:animate-spin" aria-hidden="true" />
            Agendando…
          </>
        ) : (
          'Confirmar hora'
        )}
      </Button>
    </form>
  )
}
