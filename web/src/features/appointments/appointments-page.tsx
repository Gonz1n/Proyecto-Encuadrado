'use client'

import { useState } from 'react'
import { addDays, addWeeks, format } from 'date-fns'
import { useParams, useSearchParams } from 'next/navigation'
import { useSetSearchParams } from '@/lib/use-set-search-params'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { useCan } from '@/features/permissions/use-can'
import { CalendarNavigation } from './calendar-navigation'
import { formatLongDate } from '@/lib/format'
import { DATE_FORMAT, parseDateParam, resolveView, weekDays, weekRangeLabel } from './calendar-layout'
import { DayView } from './day-view'
import { ListView } from './list-view'
import { ProfessionalFilter } from './professional-filter'
import { ViewSwitcher } from './view-switcher'
import { WeekView } from './week-view'

const RANGES = [
  { days: 7, label: 'Próximos 7 días' },
  { days: 30, label: 'Próximos 30 días' },
] as const

export function AppointmentsPage() {
  const { slug } = useParams<{ slug: string }>()
  const viewAll = useCan('agenda:view-all')
  const searchParams = useSearchParams()
  const setSearchParams = useSetSearchParams()
  const [today] = useState(() => new Date())

  const view = resolveView(searchParams.get('vista'), viewAll)
  const reference = parseDateParam(searchParams.get('fecha'), today)
  const days = searchParams.get('rango') === '30' ? 30 : 7
  const includeCancelled = searchParams.get('canceladas') === '1'
  const professionalParam = Number(searchParams.get('profesional'))
  const professional =
    viewAll && view !== 'dia' && Number.isInteger(professionalParam) && professionalParam > 0
      ? professionalParam
      : undefined

  const updateParams = (changes: Record<string, string | undefined>) =>
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current)
        for (const [key, value] of Object.entries(changes)) {
          if (value) next.set(key, value)
          else next.delete(key)
        }
        return next
      },
      { replace: true },
    )

  const moveWeek = (amount: number) => updateParams({ fecha: format(addWeeks(reference, amount), DATE_FORMAT) })
  const moveDay = (amount: number) => updateParams({ fecha: format(addDays(reference, amount), DATE_FORMAT) })
  const week = weekDays(reference)
  const title = viewAll ? 'Agenda del centro' : 'Mi agenda'

  return (
    <div className="space-y-6">
      <title>{`${title} | Encuadrado Centros`}</title>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <ViewSwitcher
          value={view}
          viewAll={viewAll}
          onChange={(next) => updateParams({ vista: next === 'lista' ? undefined : next })}
        />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        {view === 'lista' ? (
          <div role="group" aria-label="Rango de fechas" className="flex gap-2">
            {RANGES.map((range) => (
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
            onPrevious={() => (view === 'dia' ? moveDay(-1) : moveWeek(-1))}
            onToday={() => updateParams({ fecha: undefined })}
            onNext={() => (view === 'dia' ? moveDay(1) : moveWeek(1))}
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
    </div>
  )
}
