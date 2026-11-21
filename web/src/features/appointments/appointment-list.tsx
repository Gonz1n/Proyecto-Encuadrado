'use client'

import { format, isToday, isTomorrow, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Mail, Phone, Video } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { capitalize, formatCLP } from '@/lib/format'
import type { Appointment } from './api'
import { AppointmentDetailDialog } from './appointment-detail-dialog'

function groupByDay(appointments: Appointment[]) {
  const groups = new Map<string, Appointment[]>()
  for (const appointment of appointments) {
    const day = appointment.start.slice(0, 10)
    groups.set(day, [...(groups.get(day) ?? []), appointment])
  }
  return [...groups.entries()]
}

function countLabel(items: Appointment[]) {
  const cancelled = items.filter((item) => item.status === 'cancelled').length
  const confirmed = items.length - cancelled
  const base = confirmed === 1 ? '1 cita' : `${confirmed} citas`
  if (cancelled === 0) return base
  return `${base} · ${cancelled === 1 ? '1 cancelada' : `${cancelled} canceladas`}`
}

function dayHint(date: Date) {
  if (isToday(date)) return 'Hoy'
  if (isTomorrow(date)) return 'Mañana'
  return null
}

type AppointmentListProps = {
  appointments: Appointment[]
  showProfessional: boolean
}

export function AppointmentList({ appointments, showProfessional }: AppointmentListProps) {
  const [selected, setSelected] = useState<Appointment | null>(null)
  return (
    <div className="space-y-8">
      {groupByDay(appointments).map(([day, items]) => {
        const date = parseISO(day)
        const hint = dayHint(date)
        const headingId = `day-${day}`
        return (
          <section key={day} aria-labelledby={headingId} className="space-y-2">
            <div className="flex items-baseline gap-2">
              <h2 id={headingId} className="text-base font-semibold tracking-tight">
                {capitalize(format(date, "EEEE d 'de' MMMM", { locale: es }))}
              </h2>
              {hint && (
                <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                  {hint}
                </span>
              )}
              <span className="text-sm text-muted-foreground">
                {countLabel(items)}
              </span>
            </div>
            <ul className="divide-y rounded-lg border">
              {items.map((appointment) => (
                <AppointmentRow
                  key={appointment.id}
                  appointment={appointment}
                  showProfessional={showProfessional}
                  onSelect={setSelected}
                />
              ))}
            </ul>
          </section>
        )
      })}
      <AppointmentDetailDialog appointment={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

function AppointmentRow({
  appointment,
  showProfessional,
  onSelect,
}: {
  appointment: Appointment
  showProfessional: boolean
  onSelect: (appointment: Appointment) => void
}) {
  const cancelled = appointment.status === 'cancelled'
  const { patient_name: name, patient_phone: phone, patient_email: email } = appointment
  return (
    <li className="relative grid gap-x-6 gap-y-2 px-4 py-3 sm:grid-cols-[8rem_1fr_1fr_auto] sm:items-center">
      <p className="text-sm font-medium tabular-nums">
        {format(parseISO(appointment.start), 'HH:mm')} – {format(parseISO(appointment.end), 'HH:mm')}
      </p>
      <div className="min-w-0 space-y-1">
        <button
          type="button"
          onClick={() => onSelect(appointment)}
          className={cn('block max-w-full truncate text-left font-medium outline-none after:absolute after:inset-0 focus-visible:after:ring-3 focus-visible:after:ring-ring/50', cancelled && 'line-through')}
        >
          {name}
          <span className="sr-only">: ver detalle</span>
        </button>
        {cancelled && (
          <span className="inline-block rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
            Cancelada
          </span>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <a
            href={`tel:${phone}`}
            aria-label={`Llamar a ${name}`}
            className="relative z-10 inline-flex items-center gap-1 hover:text-foreground hover:underline"
          >
            <Phone className="size-3.5" aria-hidden="true" />
            {phone}
          </a>
          <a
            href={`mailto:${email}`}
            aria-label={`Enviar correo a ${name}`}
            className="relative z-10 inline-flex min-w-0 items-center gap-1 hover:text-foreground hover:underline"
          >
            <Mail className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{email}</span>
          </a>
        </div>
      </div>
      <div className="text-sm">
        <p>{appointment.service.name}</p>
        {appointment.modality === 'remote' && (
          <p className="flex items-center gap-1 text-muted-foreground">
            <Video className="size-3.5" aria-hidden="true" />
            Remota
          </p>
        )}
        <p className="text-muted-foreground">{formatCLP(appointment.service.price_clp)}</p>
      </div>
      {showProfessional && (
        <p className="text-sm text-muted-foreground sm:text-right">
          <span className="sr-only">Profesional: </span>
          {appointment.professional.full_name}
        </p>
      )}
    </li>
  )
}
