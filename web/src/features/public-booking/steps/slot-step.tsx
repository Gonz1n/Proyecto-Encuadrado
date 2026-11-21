import { useMemo, useState } from 'react'
import { addDays, format, parseISO, startOfDay } from 'date-fns'
import { es } from 'react-day-picker/locale'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatLongDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useBookingFlow } from '../booking-context'
import { useAvailability, useAvailableDays } from '../hooks'

const toKey = (day: Date) => format(day, 'yyyy-MM-dd')

function groupSlots(slots: string[]) {
  return [
    { label: 'Mañana', slots: slots.filter((slot) => slot < '12:00') },
    { label: 'Tarde', slots: slots.filter((slot) => slot >= '12:00') },
  ].filter((group) => group.slots.length > 0)
}

export function SlotStep() {
  const { slug, state } = useBookingFlow()
  const query = { service: state.service?.id, professional: state.professional?.id }
  const days = useAvailableDays(slug, query)
  const available = useMemo(() => new Set(days.data?.days), [days.data])
  const [today] = useState(() => startOfDay(new Date()))
  const selected = state.date ? parseISO(state.date) : undefined

  if (days.isPending) return <Skeleton className="h-80 w-full max-w-sm rounded-xl" />
  if (days.isError) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">No pudimos cargar los días disponibles.</p>
        <Button variant="outline" onClick={() => days.refetch()}>
          Reintentar
        </Button>
      </div>
    )
  }
  if (days.data.days.length === 0) {
    return (
      <div className="space-y-3 rounded-xl border border-dashed p-5">
        <p className="font-medium">No quedan horas en los próximos 30 días</p>
        <p className="text-sm text-muted-foreground">
          Prueba con otro profesional o con otro servicio.
        </p>
        <Button variant="outline" onClick={() => state.update({ professional: null })}>
          Elegir otro profesional
        </Button>
      </div>
    )
  }

  const firstDay = parseISO(days.data.days[0])

  return (
    <div className="grid gap-6 md:grid-cols-[auto_minmax(0,1fr)] md:items-start">
      <div className="w-fit max-w-full rounded-xl border bg-card p-2 sm:p-3">
        <Calendar
          mode="single"
          locale={es}
          showOutsideDays={false}
          selected={selected}
          onSelect={(day) => (day ? state.update({ date: toKey(day) }, { replace: true }) : undefined)}
          defaultMonth={selected ?? firstDay}
          startMonth={addDays(today, 1)}
          endMonth={addDays(today, 30)}
          disabled={(day) => !available.has(toKey(day))}
          className="bg-transparent p-0 [--cell-size:--spacing(10)] sm:[--cell-size:--spacing(11)]"
        />
      </div>
      {state.date ? (
        <DaySlots date={state.date} />
      ) : (
        <p className="text-sm text-muted-foreground md:pt-3">
          Elige un día disponible para ver sus horas.
        </p>
      )}
    </div>
  )
}

function DaySlots({ date }: { date: string }) {
  const { slug, state } = useBookingFlow()
  const slots = useAvailability(slug, {
    service: state.service?.id,
    professional: state.professional?.id,
    date,
  })

  return (
    <section aria-labelledby="day-slots-heading" className="space-y-4">
      <h2 id="day-slots-heading" className="font-medium">
        {formatLongDate(parseISO(date))}
      </h2>
      {slots.isPending ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-11 rounded-lg" />
          ))}
        </div>
      ) : slots.isError || slots.data.slots.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Este día ya no tiene horas libres. Elige otro día.
        </p>
      ) : (
        groupSlots(slots.data.slots).map((group) => (
          <div key={group.label} className="space-y-2">
            <p className="text-sm text-muted-foreground">{group.label}</p>
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {group.slots.map((slot) => (
                <li key={slot}>
                  <button
                    type="button"
                    aria-pressed={state.time === slot}
                    onClick={() => state.update({ time: slot })}
                    className={cn(
                      'h-11 w-full rounded-lg border bg-card text-sm font-medium tabular-nums transition-colors outline-none hover:border-primary/40 hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50',
                      'aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground',
                    )}
                  >
                    {slot}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </section>
  )
}
