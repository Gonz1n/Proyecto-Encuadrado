'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import type { Appointment } from './api'
import { DayTimePicker } from './day-time-picker'
import { useAppointmentAvailability, useAppointmentAvailableDays, useRescheduleAppointment } from './hooks'
import { NoteField } from './note-field'

type RescheduleDialogProps = {
  slug: string
  appointment: Appointment
  open: boolean
  onOpenChange: (open: boolean) => void
  onDone: () => void
}

export function RescheduleDialog({ slug, appointment, open, onOpenChange, onDone }: RescheduleDialogProps) {
  const [date, setDate] = useState<string>()
  const [time, setTime] = useState<string>()
  const [note, setNote] = useState('')
  const days = useAppointmentAvailableDays(slug, appointment.id)
  const slots = useAppointmentAvailability(slug, appointment.id, date)
  const reschedule = useRescheduleAppointment(slug, appointment.id, onDone, () => setTime(undefined))

  const chooseDate = (day: string) => {
    setDate(day)
    setTime(undefined)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Reagendar cita</DialogTitle>
          <DialogDescription>
            {appointment.patient_name} · {appointment.service.name} · {appointment.professional.full_name}
          </DialogDescription>
        </DialogHeader>
        {days.isPending ? (
          <Skeleton className="h-72 w-full rounded-xl" />
        ) : days.isError ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">No pudimos cargar los días disponibles.</p>
            <Button variant="outline" onClick={() => days.refetch()}>
              Reintentar
            </Button>
          </div>
        ) : days.data.days.length === 0 ? (
          <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            No quedan horas libres en los próximos 30 días para este profesional.
          </p>
        ) : (
          <DayTimePicker
            days={days.data.days}
            slots={slots}
            date={date}
            time={time}
            onDateChange={chooseDate}
            onTimeChange={setTime}
          />
        )}
        <NoteField value={note} onChange={setNote} />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={reschedule.isPending}>
            Volver
          </Button>
          <Button
            disabled={!date || !time || reschedule.isPending}
            onClick={() => reschedule.mutate({ start: `${date}T${time}`, note: note.trim() })}
          >
            {reschedule.isPending ? 'Reagendando...' : 'Confirmar nueva hora'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
