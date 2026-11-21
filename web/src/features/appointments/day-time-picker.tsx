'use client'

import { useId, useMemo } from 'react'
import { addDays, format, parseISO, startOfDay } from 'date-fns'
import { es } from 'react-day-picker/locale'
import { Calendar } from '@/components/ui/calendar'
import { Skeleton } from '@/components/ui/skeleton'
import { formatLongDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { DATE_FORMAT } from './calendar-layout'

type DayTimePickerProps = {
  days: string[]
  slots: { isPending: boolean; isError: boolean; data?: { slots: string[] } }
  date: string | undefined
  time: string | undefined
  onDateChange: (date: string) => void
  onTimeChange: (time: string) => void
}

export function DayTimePicker({ days, slots, date, time, onDateChange, onTimeChange }: DayTimePickerProps) {
  const headingId = useId()
  const today = useMemo(() => startOfDay(new Date()), [])
  const available = useMemo(() => new Set(days), [days])

  return (
    <div className="grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start">
      <div className="w-fit max-w-full rounded-xl border bg-card p-2">
        <Calendar
          mode="single"
          locale={es}
          showOutsideDays={false}
          selected={date ? parseISO(date) : undefined}
          onSelect={(day) => day && onDateChange(format(day, DATE_FORMAT))}
          defaultMonth={parseISO(days[0])}
          startMonth={today}
          endMonth={addDays(today, 30)}
          disabled={(day) => !available.has(format(day, DATE_FORMAT))}
          className="bg-transparent p-0 [--cell-size:--spacing(9)]"
        />
      </div>
      <section aria-labelledby={headingId} className="space-y-2">
        <h3 id={headingId} className="text-sm font-medium">
          {date ? formatLongDate(parseISO(date)) : 'Elige un día disponible para ver sus horas.'}
        </h3>
        {date &&
          (slots.isPending ? (
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 6 }, (_, index) => (
                <Skeleton key={index} className="h-10 rounded-lg" />
              ))}
            </div>
          ) : slots.isError || !slots.data || slots.data.slots.length === 0 ? (
            <p className="text-sm text-muted-foreground">Este día ya no tiene horas libres. Elige otro día.</p>
          ) : (
            <ul className="grid grid-cols-3 gap-2">
              {slots.data.slots.map((slot) => (
                <li key={slot}>
                  <button
                    type="button"
                    aria-pressed={time === slot}
                    onClick={() => onTimeChange(slot)}
                    className={cn(
                      'h-10 w-full rounded-lg border bg-card text-sm font-medium tabular-nums transition-colors outline-none hover:border-primary/40 hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50',
                      'aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground',
                    )}
                  >
                    {slot}
                  </button>
                </li>
              ))}
            </ul>
          ))}
      </section>
    </div>
  )
}
