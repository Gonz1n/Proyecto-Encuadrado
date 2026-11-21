import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { Building2, Loader2, Video } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { format, subYears } from 'date-fns'
import { ApiError } from '@/lib/api-client'
import { buildPatientShape, firstMessage, PATIENT_FIELD_NAMES } from '@/features/patient/patient-fields'
import { PatientInputs } from '@/features/patient/patient-inputs'
import { queryKeys } from '@/lib/query-keys'
import { useBookingFlow, type PatientDraft } from '../booking-context'
import { saveBooking } from '../booking-storage'
import { useCreateBooking } from '../hooks'
import { MODALITY_LABELS, type Modality } from '@/lib/modality'

const TERMS_ERROR = 'Debes aceptar los términos y condiciones'
const CONSENT_ERROR = 'Debes autorizar el tratamiento de tus datos personales'

const buildPatientSchema = (today: string, oldest: string) =>
  z.object({
    ...buildPatientShape(today, oldest),
    modality: z.enum(['in_person', 'remote']),
    accept_terms: z.boolean().refine(Boolean, TERMS_ERROR),
    data_consent: z.boolean().refine(Boolean, CONSENT_ERROR),
  })

const PATIENT_FIELDS = [...PATIENT_FIELD_NAMES, 'accept_terms', 'data_consent'] as const

function ConsentCheckbox({
  id,
  checked,
  onCheckedChange,
  error,
  children,
}: {
  id: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="flex min-h-11 cursor-pointer items-start gap-3 py-2 text-sm leading-snug">
        <Checkbox
          id={id}
          checked={checked}
          onCheckedChange={onCheckedChange}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="mt-0.5 size-5 border-[var(--cp-granate)] bg-white data-checked:border-[var(--cp-granate)] data-checked:bg-[var(--cp-granate)] data-checked:text-white focus-visible:ring-[var(--cp-granate)]/40"
        />
        <span>{children}</span>
      </label>
      {error ? (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}

function TermsDialog({ centerName, terms }: { centerName: string; terms: string }) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="link"
            className="-mt-1 h-11 px-0 text-[var(--cp-granate)] underline underline-offset-4"
          />
        }
      >
        Ver términos
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Términos y condiciones</DialogTitle>
          <DialogDescription>{centerName}</DialogDescription>
        </DialogHeader>
        <p className="max-h-[60vh] overflow-y-auto text-sm leading-relaxed whitespace-pre-line text-pretty">
          {terms}
        </p>
      </DialogContent>
    </Dialog>
  )
}

export function PatientStep() {
  const { slug, center, state, patientDraft, savePatientDraft } = useBookingFlow()
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
      <PatientInputs
        register={register}
        errors={errors}
        today={today}
        oldest={oldest}
        inputClassName="h-11 border-[var(--cp-granate)]/60 bg-white md:h-10"
      />
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
                    className="h-11 justify-start gap-2 rounded-full border-[var(--cp-granate)] active:scale-[0.97] motion-reduce:active:scale-100 aria-pressed:bg-[var(--cp-granate)] aria-pressed:text-white [&:not([aria-pressed=true])]:bg-[var(--cp-card)] [&:not([aria-pressed=true])]:text-[var(--cp-granate)]"
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
      <Controller
        control={control}
        name="accept_terms"
        render={({ field }) => (
          <div>
            <ConsentCheckbox
              id="accept_terms"
              checked={field.value}
              onCheckedChange={field.onChange}
              error={errors.accept_terms?.message}
            >
              Acepto los términos y condiciones de {center.name}
            </ConsentCheckbox>
            {center.terms ? <TermsDialog centerName={center.name} terms={center.terms} /> : null}
          </div>
        )}
      />
      <Controller
        control={control}
        name="data_consent"
        render={({ field }) => (
          <ConsentCheckbox
            id="data_consent"
            checked={field.value}
            onCheckedChange={field.onChange}
            error={errors.data_consent?.message}
          >
            Autorizo a {center.name} a tratar mis datos personales y de salud para gestionar mi atención, conforme a la Ley 21.719 de protección de datos personales.
          </ConsentCheckbox>
        )}
      />
      <Button type="submit" size="lg" className="h-11 w-full rounded-full active:scale-[0.97] motion-reduce:active:scale-100" disabled={isSubmitting}>
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
