'use client'

import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { formatLongDate } from '@/utils/format'
import type { Appointment } from '../types/appointment'
import { useCancelAppointment } from '../hooks/use-manage-appointment'
import { NoteField } from './note-field'

type CancelAppointmentDialogProps = {
  slug: string
  appointment: Appointment
  open: boolean
  onOpenChange: (open: boolean) => void
  onDone: () => void
}

export function CancelAppointmentDialog({ slug, appointment, open, onOpenChange, onDone }: CancelAppointmentDialogProps) {
  const [note, setNote] = useState('')
  const cancel = useCancelAppointment(slug, appointment.id, onDone)
  const start = parseISO(appointment.start)

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            ¿Cancelar la cita de {appointment.patient_name} del {formatLongDate(start)} a las{' '}
            {format(start, 'HH:mm')}?
          </AlertDialogTitle>
          <AlertDialogDescription>La hora volverá a quedar disponible. El paciente no recibe un aviso automático.</AlertDialogDescription>
        </AlertDialogHeader>
        <NoteField value={note} onChange={setNote} />
        <AlertDialogFooter>
          <AlertDialogCancel disabled={cancel.isPending}>Volver</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={cancel.isPending}
            onClick={(event) => {
              event.preventDefault()
              cancel.mutate(note.trim())
            }}
          >
            {cancel.isPending ? 'Cancelando...' : 'Cancelar cita'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
