'use client'

import { useState } from 'react'
import { format, isToday } from 'date-fns'
import { useCenter } from '@/features/center/hooks/use-center'
import { useMembers } from '@/features/center/hooks/use-members'
import { AgendaError } from './agenda-error'
import type { Appointment } from './api'
import { AppointmentDetailDialog } from './appointment-detail-dialog'
import { CalendarGrid, CalendarSkeleton } from './calendar-grid'
import { DATE_FORMAT, dayColumns, professionalColor, visibleHourRange } from './calendar-layout'
import { useAppointments } from './hooks'

const COLUMN_MIN_WIDTH_REM = 11
const AXIS_WIDTH_REM = 3.5

export function DayView({ slug, date, includeCancelled }: { slug: string; date: Date; includeCancelled: boolean }) {
  const [selected, setSelected] = useState<Appointment | null>(null)
  const day = format(date, DATE_FORMAT)
  const appointments = useAppointments(slug, { from: day, to: day, include_cancelled: includeCancelled })
  const members = useMembers(slug)
  const center = useCenter(slug)

  if (appointments.isPending || members.isPending || center.isPending) return <CalendarSkeleton />
  if (appointments.isError || members.isError || center.isError) {
    return (
      <AgendaError
        onRetry={() => {
          if (appointments.isError) appointments.refetch()
          if (members.isError) members.refetch()
          if (center.isError) center.refetch()
        }}
      />
    )
  }

  const data = appointments.data
  const professionals = dayColumns(
    members.data
      .filter((member) => member.role === 'admin' || member.role === 'member')
      .map((member) => ({ id: member.id, full_name: member.user.full_name })),
    data,
  )
  const today = isToday(date)

  return (
    <div className="space-y-3">
      {data.length === 0 && <p className="text-sm text-muted-foreground">No hay citas este día.</p>}
      <CalendarGrid
        columns={professionals.map((professional) => ({
          key: String(professional.id),
          label: professional.name,
          color: professionalColor(professional.id),
          isToday: today,
        }))}
        range={visibleHourRange(center.data.opening_time, center.data.closing_time, data)}
        appointments={data}
        columnOf={(appointment) => String(appointment.professional.id)}
        colorFor={(appointment) => professionalColor(appointment.professional.id)}
        showProfessional={false}
        minWidth={`max(44rem, ${professionals.length * COLUMN_MIN_WIDTH_REM + AXIS_WIDTH_REM}rem)`}
        onSelect={setSelected}
      />
      <AppointmentDetailDialog appointment={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
