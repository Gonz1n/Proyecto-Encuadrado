'use client'

import { useState } from 'react'
import { differenceInYears, format, parseISO } from 'date-fns'
import { Mail, Phone } from 'lucide-react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatCLP, formatLongDate } from '@/lib/format'
import { useCanManageAppointment } from '@/features/permissions/use-can'
import type { Appointment } from './api'
import { AppointmentHistory } from './appointment-history'
import { CancelAppointmentDialog } from './cancel-appointment-dialog'
import { RescheduleDialog } from './reschedule-dialog'
import { MODALITY_LABELS } from '@/lib/modality'

type AppointmentDetailDialogProps = {
  appointment: Appointment | null
  onClose: () => void
}

export function AppointmentDetailDialog({ appointment, onClose }: AppointmentDetailDialogProps) {
  const [shown, setShown] = useState(appointment)
  if (appointment && appointment !== shown) setShown(appointment)

  return (
    <Dialog open={appointment !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>{shown && <AppointmentDetail appointment={shown} onClose={onClose} />}</DialogContent>
    </Dialog>
  )
}

function AppointmentDetail({ appointment, onClose }: { appointment: Appointment; onClose: () => void }) {
  const { slug } = useParams<{ slug: string }>()
  const [mode, setMode] = useState<'reschedule' | 'cancel' | null>(null)
  const canManage = useCanManageAppointment(appointment)
  const [now] = useState(() => new Date())
  const { patient_name: name, patient_phone: phone, patient_email: email } = appointment
  const start = parseISO(appointment.start)
  const editable = canManage && appointment.status === 'confirmed' && start > now
  const linkClass = 'inline-flex min-w-0 items-center gap-1.5 hover:underline'

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-lg">{name}</DialogTitle>
        <DialogDescription className="tabular-nums">
          {formatLongDate(start)}, {format(start, 'HH:mm')} – {format(parseISO(appointment.end), 'HH:mm')}
        </DialogDescription>
      </DialogHeader>
      <dl className="grid grid-cols-[6.5rem_1fr] gap-x-3 gap-y-3 border-t pt-4">
        <dt className="text-muted-foreground">RUT</dt>
        <dd className="tabular-nums">{appointment.patient_rut || 'Sin registrar'}</dd>
        <dt className="text-muted-foreground">Edad</dt>
        <dd className="tabular-nums">{patientAge(appointment.patient_birth_date)}</dd>
        <dt className="text-muted-foreground">Teléfono</dt>
        <dd className="min-w-0">
          <a href={`tel:${phone}`} aria-label={`Llamar a ${name}`} className={linkClass}>
            <Phone className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
            {phone}
          </a>
        </dd>
        <dt className="text-muted-foreground">Correo</dt>
        <dd className="min-w-0">
          <a href={`mailto:${email}`} aria-label={`Enviar correo a ${name}`} className={linkClass}>
            <Mail className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="truncate">{email}</span>
          </a>
        </dd>
        <dt className="text-muted-foreground">Servicio</dt>
        <dd>
          {appointment.service.name}
          <span className="block text-muted-foreground">{formatCLP(appointment.service.price_clp)}</span>
        </dd>
        <dt className="text-muted-foreground">Modalidad</dt>
        <dd>{MODALITY_LABELS[appointment.modality]}</dd>
        <dt className="text-muted-foreground">Profesional</dt>
        <dd>{appointment.professional.full_name}</dd>
      </dl>
      <AppointmentHistory changes={appointment.changes} />
      {editable && (
        <>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMode('cancel')}>
              Cancelar cita
            </Button>
            <Button onClick={() => setMode('reschedule')}>Reagendar</Button>
          </DialogFooter>
          {mode === 'reschedule' && (
            <RescheduleDialog
              slug={slug}
              appointment={appointment}
              open
              onOpenChange={(open) => !open && setMode(null)}
              onDone={onClose}
            />
          )}
          {mode === 'cancel' && (
            <CancelAppointmentDialog
              slug={slug}
              appointment={appointment}
              open
              onOpenChange={(open) => !open && setMode(null)}
              onDone={onClose}
            />
          )}
        </>
      )}
    </>
  )
}

function patientAge(birthDate: string | null): string {
  if (!birthDate) return 'Sin registrar'
  const born = parseISO(birthDate)
  return `${differenceInYears(new Date(), born)} años (${format(born, 'dd/MM/yyyy')})`
}
