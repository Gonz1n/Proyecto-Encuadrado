'use client'

import { useState } from 'react'
import { addDays, format } from 'date-fns'
import { CalendarX } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { AgendaError } from './agenda-error'
import { AppointmentList } from './appointment-list'
import { DATE_FORMAT } from '@/constants/dates'
import { useAppointments } from '../hooks/use-appointments'

type ListViewProps = {
  slug: string
  days: number
  professional: number | undefined
  showProfessional: boolean
  includeCancelled: boolean
}

export function ListView({ slug, days, professional, showProfessional, includeCancelled }: ListViewProps) {
  const [today] = useState(() => new Date())
  const { data, isPending, isError, refetch } = useAppointments(slug, {
    from: format(today, DATE_FORMAT),
    to: format(addDays(today, days - 1), DATE_FORMAT),
    professional,
    include_cancelled: includeCancelled,
  })

  if (isPending) {
    return (
      <div className="space-y-3" aria-busy="true">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    )
  }
  if (isError) return <AgendaError onRetry={() => refetch()} />
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-12 text-center">
        <CalendarX className="size-8 text-muted-foreground" aria-hidden="true" />
        <p className="font-medium">No hay citas en este período</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Cuando un paciente agende, la cita aparecerá aquí. Prueba con un rango más amplio.
        </p>
      </div>
    )
  }
  return <AppointmentList appointments={data} showProfessional={showProfessional} />
}
