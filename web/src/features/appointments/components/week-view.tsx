'use client'

import { useState } from 'react'
import { format, isToday, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { capitalize } from '@/utils/format'
import { useCenter } from '@/features/center/hooks/use-center'
import { AgendaError } from './agenda-error'
import type { Appointment } from '../types/appointment'
import { AppointmentDetailDialog } from './appointment-detail-dialog'
import { CalendarGrid, CalendarSkeleton } from './calendar-grid'
import { DATE_FORMAT } from '@/constants/dates'
import { professionalColor, visibleHourRange, weekDays } from '../utils/calendar-layout'
import { useAppointments } from '../hooks/use-appointments'
import { ProfessionalLegend } from './professional-legend'
import { WEEK_ACCENT_CLASS } from '../constants/styles'

type WeekViewProps = {
  slug: string
  reference: Date
  professional: number | undefined
  viewAll: boolean
  includeCancelled: boolean
}

export function WeekView({ slug, reference, professional, viewAll, includeCancelled }: WeekViewProps) {
  const [selected, setSelected] = useState<Appointment | null>(null)
  const days = weekDays(reference)
  const appointments = useAppointments(slug, {
    from: format(days[0], DATE_FORMAT),
    to: format(days[6], DATE_FORMAT),
    professional,
    include_cancelled: includeCancelled,
  })
  const center = useCenter(slug)

  if (appointments.isPending || center.isPending) return <CalendarSkeleton />
  if (appointments.isError || center.isError) {
    return (
      <AgendaError
        onRetry={() => {
          if (appointments.isError) appointments.refetch()
          if (center.isError) center.refetch()
        }}
      />
    )
  }

  const data = appointments.data
  const byProfessional = viewAll && !professional
  const professionals = [...new Map(data.map((a) => [a.professional.id, a.professional])).values()].sort((a, b) =>
    a.full_name.localeCompare(b.full_name, 'es'),
  )

  return (
    <div className="space-y-3">
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay citas esta semana.</p>
      ) : (
        byProfessional && <ProfessionalLegend professionals={professionals} />
      )}
      <CalendarGrid
        columns={days.map((day) => ({
          key: format(day, DATE_FORMAT),
          label: capitalize(format(day, 'EEE', { locale: es })),
          dayNumber: format(day, 'd'),
          badge: isToday(day) ? 'hoy' : undefined,
          isToday: isToday(day),
          muted: !isToday(day),
        }))}
        range={visibleHourRange(center.data.opening_time, center.data.closing_time, data)}
        appointments={data}
        columnOf={(appointment) => format(parseISO(appointment.start), DATE_FORMAT)}
        colorFor={byProfessional ? (appointment) => professionalColor(appointment.professional.id) : () => WEEK_ACCENT_CLASS}
        showProfessional={byProfessional}
        onSelect={setSelected}
      />
      <AppointmentDetailDialog appointment={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
