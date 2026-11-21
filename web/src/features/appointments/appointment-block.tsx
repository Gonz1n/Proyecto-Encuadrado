'use client'

import { differenceInMinutes, format, parseISO } from 'date-fns'
import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'
import type { Appointment } from './api'
import { Video } from 'lucide-react'

type AppointmentBlockProps = {
  appointment: Appointment
  color: string
  showProfessional: boolean
  style: CSSProperties
  onSelect: (appointment: Appointment) => void
}

export function AppointmentBlock({ appointment, color, showProfessional, style, onSelect }: AppointmentBlockProps) {
  const start = parseISO(appointment.start)
  const end = parseISO(appointment.end)
  const minutes = differenceInMinutes(end, start)
  const time = `${format(start, 'HH:mm')} – ${format(end, 'HH:mm')}`
  const professional = appointment.professional.full_name
  const cancelled = appointment.status === 'cancelled'
  const label = [time, appointment.patient_name, appointment.service.name, appointment.modality === 'remote' && 'remota', showProfessional && `con ${professional}`, cancelled && 'cancelada']
    .filter(Boolean)
    .join(', ')

  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => onSelect(appointment)}
      style={style}
      className={cn(
        'absolute overflow-hidden rounded-md border-l-[3px] px-1.5 py-0.5 text-left text-xs leading-4 outline-none transition-[filter] hover:brightness-95 focus-visible:z-20 focus-visible:ring-2 focus-visible:ring-ring',
        cancelled ? 'border-dashed border-muted-foreground/60 bg-muted/60 text-muted-foreground' : color,
      )}
    >
      {minutes < 60 ? (
        <>
          <span className="block truncate">
            <span className="font-semibold tabular-nums">{format(start, 'HH:mm')}</span>{' '}
            {appointment.modality === 'remote' && <Video className="mr-1 inline size-3 align-[-1px]" aria-hidden="true" />}
            <span className={cn(cancelled && 'line-through')}>{appointment.patient_name}</span>
            {cancelled && minutes <= 30 && <span className="font-medium"> · Cancelada</span>}
          </span>
          {minutes > 30 && <span className="block truncate opacity-80">{appointment.service.name}</span>}
          {minutes > 30 && cancelled && <span className="block truncate font-medium">Cancelada</span>}
        </>
      ) : (
        <>
          <span className="block truncate tabular-nums opacity-80">{time}</span>
          <span className={cn('block truncate font-semibold', cancelled && 'line-through')}>
            {appointment.modality === 'remote' && <Video className="mr-1 inline size-3 align-[-1px]" aria-hidden="true" />}
            {appointment.patient_name}
          </span>
          <span className="block truncate opacity-80">{appointment.service.name}</span>
          {cancelled && <span className="block truncate font-medium">Cancelada</span>}
          {showProfessional && minutes >= 90 && <span className="block truncate opacity-80">{professional}</span>}
        </>
      )}
    </button>
  )
}
