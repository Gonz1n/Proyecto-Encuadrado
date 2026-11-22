'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { format, subYears } from 'date-fns'
import { Loader2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import type { Membership } from '@/features/auth/api'
import { buildPatientShape, firstMessage, PATIENT_FIELD_NAMES } from '@/features/patient/patient-fields'
import { PatientInputs } from '@/features/patient/patient-inputs'
import { useAvailability, useAvailableDays, usePublicCenter } from '@/features/public-booking/hooks'
import { ApiError } from '@/lib/api-client'
import { MODALITY_LABELS, type Modality } from '@/lib/modality'
import { selectableProfessionals } from './booking-professionals'
import { DayTimePicker } from './day-time-picker'
import { useCreateAppointment } from './hooks'

type CreateAppointmentDialogProps = {
  slug: string
  membership: Membership
  open: boolean
  onOpenChange: (open: boolean) => void
}

type FieldSelectProps = {
  label: string
  placeholder?: string
  items: { value: string; label: string }[]
  value: string | null
  disabled?: boolean
  onValueChange: (value: string | null) => void
}

function FieldSelect({ label, placeholder, items, value, disabled, onValueChange }: FieldSelectProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select items={items} value={value} disabled={disabled} onValueChange={onValueChange}>
        <SelectTrigger aria-label={label} className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

const emptyPatient = {
  patient_name: '',
  patient_email: '',
  patient_phone: '',
  patient_rut: '',
  patient_birth_date: '',
}

export function CreateAppointmentDialog({ slug, membership, open, onOpenChange }: CreateAppointmentDialogProps) {
  const center = usePublicCenter(slug)
  const [serviceId, setServiceId] = useState<number>()
  const [chosenProfessionalId, setProfessionalId] = useState<number>()
  const [modality, setModality] = useState<Modality>('in_person')
  const [date, setDate] = useState<string>()
  const [time, setTime] = useState<string>()
  const create = useCreateAppointment(slug)

  const today = format(new Date(), 'yyyy-MM-dd')
  const oldest = format(subYears(new Date(), 120), 'yyyy-MM-dd')
  const schema = useMemo(() => z.object(buildPatientShape(today, oldest)), [today, oldest])
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<typeof emptyPatient>({ resolver: zodResolver(schema), defaultValues: emptyPatient })

  const professionals = selectableProfessionals(membership, center.data?.professionals ?? [])
  const professionalId = chosenProfessionalId ?? (professionals.length === 1 ? professionals[0].id : undefined)
  const services = center.data?.services ?? []
  const query = { service: serviceId, professional: professionalId }
  const days = useAvailableDays(slug, query)
  const slots = useAvailability(slug, { ...query, date })
  const ready = serviceId !== undefined && professionalId !== undefined

  const resetSlot = () => {
    setDate(undefined)
    setTime(undefined)
  }

  const onSubmit = handleSubmit((values) => {
    if (!ready || !date || !time) return
    create.mutate(
      { service: serviceId, professional: professionalId, start: `${date}T${time}`, modality, ...values },
      {
        onSuccess: () => onOpenChange(false),
        onError: (error) => {
          if (error instanceof ApiError && error.status === 409) {
            toast.error('Esa hora acaba de ser tomada, elige otra')
            setTime(undefined)
            return
          }
          if (error instanceof ApiError && error.status === 400 && error.data) {
            const data = error.data as Record<string, unknown>
            const general = ['service', 'professional', 'start']
              .map((key) => firstMessage(data, key))
              .find((message) => message)
            if (general) {
              toast.error(general)
              return
            }
            let mapped = false
            for (const field of PATIENT_FIELD_NAMES) {
              const message = firstMessage(data, field)
              if (message) {
                setError(field, { message })
                mapped = true
              }
            }
            if (mapped) return
          }
          toast.error('No pudimos agendar la hora. Intenta de nuevo.')
        },
      },
    )
  })

  const serviceItems = services.map((service) => ({ value: String(service.id), label: service.name }))
  const professionalItems = professionals.map((professional) => ({
    value: String(professional.id),
    label: professional.full_name,
  }))
  const modalityItems = (Object.keys(MODALITY_LABELS) as Modality[]).map((value) => ({
    value,
    label: MODALITY_LABELS[value],
  }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Agendar hora</DialogTitle>
          <DialogDescription>Reserva una hora a nombre de un paciente.</DialogDescription>
        </DialogHeader>
        {center.isPending ? (
          <Skeleton className="h-72 w-full rounded-xl" />
        ) : center.isError ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">No pudimos cargar los servicios y profesionales.</p>
            <Button variant="outline" onClick={() => center.refetch()}>
              Reintentar
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <FieldSelect
                label="Servicio"
                placeholder="Elige un servicio"
                items={serviceItems}
                value={serviceId === undefined ? null : String(serviceId)}
                onValueChange={(next) => {
                  setServiceId(next ? Number(next) : undefined)
                  resetSlot()
                }}
              />
              <FieldSelect
                label="Profesional"
                placeholder="Elige un profesional"
                items={professionalItems}
                value={professionalId === undefined ? null : String(professionalId)}
                disabled={professionals.length === 1}
                onValueChange={(next) => {
                  setProfessionalId(next ? Number(next) : undefined)
                  resetSlot()
                }}
              />
              <FieldSelect
                label="Modalidad"
                items={modalityItems}
                value={modality}
                onValueChange={(next) => next && setModality(next as Modality)}
              />
            </div>
            {!ready ? (
              <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                Elige un servicio y un profesional para ver los días disponibles.
              </p>
            ) : (
              <DayTimePicker
                days={days}
                slots={slots}
                date={date}
                time={time}
                onDateChange={(next) => {
                  setDate(next)
                  setTime(undefined)
                }}
                onTimeChange={setTime}
              />
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <PatientInputs register={register} errors={errors} today={today} oldest={oldest} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={create.isPending}>
                Volver
              </Button>
              <Button type="submit" disabled={!ready || !date || !time || create.isPending}>
                {create.isPending ? (
                  <>
                    <Loader2 className="motion-safe:animate-spin" aria-hidden="true" />
                    Agendando...
                  </>
                ) : (
                  'Agendar hora'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
