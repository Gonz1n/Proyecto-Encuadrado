'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { CalendarPlus } from 'lucide-react'
import { useCan } from '@/features/permissions/hooks/use-can'
import { useCurrentMembership } from '@/features/auth/hooks/use-current-membership'
import { CalendarNavigation } from './calendar-navigation'
import { formatLongDate } from '@/utils/format'
import { PageTitle } from '@/components/layout/page-title'
import { weekDays, weekRangeLabel } from '../utils/calendar-layout'
import { AGENDA_RANGES } from '../constants/agenda'
import { useAgendaParams } from '../hooks/use-agenda-params'
import { CreateAppointmentDialog } from './create-appointment-dialog'
import { DayView } from './day-view'
import { ListView } from './list-view'
import { ProfessionalFilter } from './professional-filter'
import { ViewSwitcher } from './view-switcher'
import { WeekView } from './week-view'

export function AppointmentsPage() {
  const { slug } = useParams<{ slug: string }>()
  const viewAll = useCan('agenda:view-all')
  const membership = useCurrentMembership()
  const [creating, setCreating] = useState(false)
  const canCreate = useCan('agenda:create')
  const { view, reference, days, includeCancelled, professional, updateParams, move } = useAgendaParams(viewAll)
  const week = weekDays(reference)
  const title = viewAll ? 'Agenda del centro' : 'Mi agenda'

  return (
    <div className="space-y-6">
      <title>{`${title} | CentradaMente`}</title>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageTitle>{title}</PageTitle>
        <div className="flex flex-wrap items-center gap-3">
          <ViewSwitcher
            value={view}
            viewAll={viewAll}
            onChange={(next) => updateParams({ vista: next === 'lista' ? undefined : next })}
          />
          {canCreate && (
            <Button onClick={() => setCreating(true)}>
              <CalendarPlus aria-hidden="true" />
              Agendar hora
            </Button>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        {view === 'lista' ? (
          <div role="group" aria-label="Rango de fechas" className="flex gap-2">
            {AGENDA_RANGES.map((range) => (
              <Button
                key={range.days}
                variant={range.days === days ? 'default' : 'outline'}
                aria-pressed={range.days === days}
                onClick={() => updateParams({ rango: range.days === 7 ? undefined : String(range.days) })}
              >
                {range.label}
              </Button>
            ))}
          </div>
        ) : (
          <CalendarNavigation
            label={view === 'dia' ? formatLongDate(reference) : weekRangeLabel(week[0], week[6])}
            previousLabel={view === 'dia' ? 'Día anterior' : 'Semana anterior'}
            nextLabel={view === 'dia' ? 'Día siguiente' : 'Semana siguiente'}
            onPrevious={() => move(-1)}
            onToday={() => updateParams({ fecha: undefined })}
            onNext={() => move(1)}
          />
        )}
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={includeCancelled}
              onCheckedChange={(checked) => updateParams({ canceladas: checked === true ? '1' : undefined })}
            />
            Mostrar canceladas
          </label>
          {viewAll && view !== 'dia' && (
            <ProfessionalFilter
              slug={slug}
              value={professional}
              onChange={(value) => updateParams({ profesional: value ? String(value) : undefined })}
            />
          )}
        </div>
      </div>
      {view === 'lista' ? (
        <ListView slug={slug} days={days} professional={professional} showProfessional={viewAll} includeCancelled={includeCancelled} />
      ) : view === 'dia' ? (
        <DayView slug={slug} date={reference} includeCancelled={includeCancelled} />
      ) : (
        <WeekView slug={slug} reference={reference} professional={professional} viewAll={viewAll} includeCancelled={includeCancelled} />
      )}
      {canCreate && membership && <CreateAppointmentDialog slug={slug} membership={membership} open={creating} onOpenChange={setCreating} />}
    </div>
  )
}
