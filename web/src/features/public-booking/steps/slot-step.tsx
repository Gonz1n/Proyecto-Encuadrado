import { useMemo, useState } from 'react'
import { addDays, format, parseISO, startOfDay } from 'date-fns'
import { es } from 'react-day-picker/locale'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatLongDate } from '@/utils/format'
import { cn } from '@/lib/utils'
import { useBookingFlow } from '../booking-context'
import { useAvailability, useAvailableDays } from '@/features/availability/hooks/use-availability'

const toKey = (day: Date) => format(day, 'yyyy-MM-dd')

function groupSlots(slots: string[]) {
  return [
    { label: 'Mañana', slots: slots.filter((slot) => slot < '12:00') },
    { label: 'Tarde', slots: slots.filter((slot) => slot >= '12:00') },
  ].filter((group) => group.slots.length > 0)
}

const outlineAction =
  'h-11 rounded-full border-[var(--cp-granate)] bg-[var(--cp-card)] px-5 text-[var(--cp-granate)] active:scale-[0.97] motion-reduce:active:scale-100 [@media(hover:hover)_and_(pointer:fine)]:hover:bg-[var(--cp-header)]'

export function SlotStep() {
  const { slug, state } = useBookingFlow()
  const query = { service: state.service?.id, professional: state.professional?.id }
  const days = useAvailableDays(slug, query)
  const available = useMemo(() => new Set(days.data?.days), [days.data])
  const [today] = useState(() => startOfDay(new Date()))
  const selected = state.date ? parseISO(state.date) : undefined

  if (days.isPending) return <Skeleton className="h-80 w-full max-w-sm rounded-2xl" />
  if (days.isError) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-[var(--cp-granate)]/80">No pudimos cargar los días disponibles.</p>
        <Button variant="outline" className={outlineAction} onClick={() => days.refetch()}>
          Reintentar
        </Button>
      </div>
    )
  }
  if (days.data.days.length === 0) {
    return (
      <div className="space-y-3 rounded-3xl border border-dashed border-[var(--cp-granate)] bg-[var(--cp-card)] p-5">
        <p className="font-medium">No quedan horas en los próximos 30 días</p>
        <p className="text-sm text-[var(--cp-granate)]/80">Prueba con otro profesional o con otro servicio.</p>
        <Button variant="outline" className={outlineAction} onClick={() => state.update({ professional: null })}>
          Elegir otro profesional
        </Button>
      </div>
    )
  }

  const firstDay = parseISO(days.data.days[0])

  return (
    <div className="grid gap-6 md:grid-cols-[auto_minmax(0,1fr)] md:items-start">
      <div className="w-fit max-w-full rounded-3xl border border-[var(--cp-granate)] bg-[var(--cp-card)] p-2 sm:p-3">
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
          className="bg-transparent p-0 [--cell-size:--spacing(10)] sm:[--cell-size:--spacing(11)] [&_button:not(:disabled):not([data-selected-single=true])]:bg-[var(--cp-header)] [&_button:not(:disabled):not([data-selected-single=true])]:text-[var(--cp-granate)] [&_button[data-selected-single=true]]:bg-[var(--cp-granate)] [&_button[data-selected-single=true]]:text-white [&_button]:duration-150 [&_button]:active:scale-[0.97] motion-reduce:[&_button]:active:scale-100 [&_button]:focus-visible:ring-[var(--cp-granate)]/40"
        />
      </div>
      {state.date ? (
        <DaySlots date={state.date} />
      ) : (
        <p className="text-sm text-[var(--cp-granate)]/80 md:pt-3">Elige un día disponible para ver sus horas.</p>
      )}
    </div>
  )
}

function DaySlots({ date }: { date: string }) {
  const { slug, state } = useBookingFlow()
  const slots = useAvailability(slug, { service: state.service?.id, professional: state.professional?.id, date })

  return (
    <section aria-labelledby="day-slots-heading" className="space-y-4">
      <h2 id="day-slots-heading" className="border-b border-[var(--cp-terracota)] pb-2 font-semibold">
        {formatLongDate(parseISO(date))}
      </h2>
      {slots.isPending ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-11 rounded-lg" />
          ))}
        </div>
      ) : slots.isError || slots.data.slots.length === 0 ? (
        <p className="text-sm text-[var(--cp-granate)]/80">Este día ya no tiene horas libres. Elige otro día.</p>
      ) : (
        groupSlots(slots.data.slots).map((group) => (
          <div key={group.label} className="space-y-2">
            <p className="text-sm text-[var(--cp-granate)]/80">{group.label}</p>
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {group.slots.map((slot) => (
                <li key={slot}>
                  <button
                    type="button"
                    aria-pressed={state.time === slot}
                    onClick={() => state.update({ time: slot })}
                    className={cn(
                      'h-11 w-full rounded-full border border-[var(--cp-granate)]/70 bg-[var(--cp-header)] text-sm font-medium text-[var(--cp-granate)] tabular-nums transition-[transform,background-color] duration-150 ease-out outline-none focus-visible:ring-3 focus-visible:ring-[var(--cp-granate)]/40 focus-visible:ring-offset-2 active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100 [@media(hover:hover)_and_(pointer:fine)]:hover:bg-[var(--cp-salmon)]',
                      'aria-pressed:border-[var(--cp-granate)] aria-pressed:bg-[var(--cp-granate)] aria-pressed:text-white [@media(hover:hover)_and_(pointer:fine)]:aria-pressed:hover:bg-[var(--cp-granate)]',
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
