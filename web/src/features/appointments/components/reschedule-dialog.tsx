'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { Appointment } from '../types/appointment'
import { DayTimePicker } from './day-time-picker'
import { useAppointmentAvailability, useAppointmentAvailableDays } from '../hooks/use-appointment-availability'
import { useRescheduleAppointment } from '../hooks/use-manage-appointment'
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
        <DayTimePicker days={days} slots={slots} date={date} time={time} onDateChange={chooseDate} onTimeChange={setTime} />
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
