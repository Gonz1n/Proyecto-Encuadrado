'use client'

import { useEffect, useRef, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { Appointment } from '../types/appointment'
import { AppointmentBlock } from './appointment-block'
import { assignLanes, blockPosition } from '../utils/calendar-layout'
import { HOUR_HEIGHT, SLOT_MINUTES } from '../constants/calendar'
import type { CalendarRange as Range } from '../types/calendar'

type CalendarColumn = {
  key: string
  label: string
  dayNumber?: string
  badge?: string
  isToday?: boolean
  muted?: boolean
  color?: string
}

type CalendarGridProps = {
  columns: CalendarColumn[]
  range: Range
  appointments: Appointment[]
  columnOf: (appointment: Appointment) => string
  colorFor: (appointment: Appointment) => string
  showProfessional: boolean
  minWidth?: string
  onSelect: (appointment: Appointment) => void
}

function clock(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

function percentOf(minutes: number, range: Range) {
  return ((minutes - range.startMinutes) / (range.endMinutes - range.startMinutes)) * 100
}

export function CalendarSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true">
      <Skeleton className="h-5 w-64" />
      <Skeleton className="h-[30rem] w-full rounded-lg" />
    </div>
  )
}

export function CalendarGrid({ columns, range, appointments, columnOf, colorFor, showProfessional, minWidth = '44rem', onSelect }: CalendarGridProps) {
  const blocksByColumn: Record<string, Appointment[]> = {}
  for (const appointment of appointments) (blocksByColumn[columnOf(appointment)] ??= []).push(appointment)
  const height = ((range.endMinutes - range.startMinutes) / 60) * HOUR_HEIGHT
  const slots: number[] = []
  for (let minutes = range.startMinutes; minutes < range.endMinutes; minutes += SLOT_MINUTES) slots.push(minutes)
  const todayHeader = useRef<HTMLDivElement>(null)
  const todayKey = columns.find((column) => column.isToday && column.dayNumber)?.key
  useEffect(() => {
    todayHeader.current?.scrollIntoView({ inline: 'center', block: 'nearest' })
  }, [todayKey])
  const template = { gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <div style={{ minWidth }}>
        <div className="flex">
          <div className="sticky left-0 z-30 w-14 shrink-0 bg-card" />
          <div className="grid flex-1 border-b bg-muted" style={template}>
            {columns.map((column) => (
              <div
                key={column.key}
                id={`columna-${column.key}`}
                ref={column.key === todayKey ? todayHeader : undefined}
                className={cn('flex min-w-0 items-center gap-1.5 border-l px-2 py-2.5', column.isToday && 'bg-accent')}
              >
                {column.color && (
                  <span aria-hidden="true" className={cn('h-3.5 w-3 shrink-0 rounded-[3px] border-l-[3px]', column.color)} />
                )}
                <span className={cn('truncate text-sm font-medium', column.muted && 'text-muted-foreground')}>
                  {column.label}
                </span>
                {column.dayNumber && (
                  <span
                    className={cn(
                      'text-sm font-medium tabular-nums',
                      column.isToday ? 'rounded-full bg-primary px-1.5 text-primary-foreground' : 'text-muted-foreground',
                    )}
                  >
                    {column.dayNumber}
                  </span>
                )}
                {column.badge && <span className="sr-only">{column.badge}</span>}
              </div>
            ))}
          </div>
        </div>
        <div className="flex">
          <div className="sticky left-0 z-30 w-14 shrink-0 bg-card" aria-hidden="true">
            <div className="relative" style={{ height }}>
              {slots
                .filter((minutes) => minutes % 60 === 0)
                .map((minutes) => (
                  <span
                    key={minutes}
                    className="absolute right-2 -translate-y-1/2 text-xs text-muted-foreground tabular-nums"
                    style={{ top: `${percentOf(minutes, range)}%` }}
                  >
                    {clock(minutes)}
                  </span>
                ))}
            </div>
          </div>
          <div className="relative flex-1" style={{ height }}>
            {slots.slice(1).map((minutes) => (
              <div
                key={minutes}
                aria-hidden="true"
                className={cn('absolute inset-x-0 border-t', minutes % 60 !== 0 && 'border-dashed border-border/60')}
                style={{ top: `${percentOf(minutes, range)}%` }}
              />
            ))}
            <div className="absolute inset-0 grid" style={template}>
              {columns.map((column) => (
                <div
                  key={column.key}
                  role="group"
                  aria-labelledby={`columna-${column.key}`}
                  className={cn('relative border-l', column.isToday && 'bg-accent/50')}
                >
                  {assignLanes(blocksByColumn[column.key] ?? []).map(({ item, lane, lanes }) => {
                    const { top, height: blockHeight } = blockPosition(item.start, item.end, range)
                    return (
                      <AppointmentBlock
                        key={item.id}
                        appointment={item}
                        color={colorFor(item)}
                        showProfessional={showProfessional}
                        onSelect={onSelect}
                        style={{
                          top: `${top}%`,
                          height: `${blockHeight}%`,
                          left: `calc(${(lane / lanes) * 100}% + 2px)`,
                          width: `calc(${100 / lanes}% - 4px)`,
                        }}
                      />
                    )
                  })}
                  {column.isToday && <NowLine range={range} />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function NowLine({ range }: { range: Range }) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  const minutes = now.getHours() * 60 + now.getMinutes()
  if (minutes < range.startMinutes || minutes >= range.endMinutes) return null
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-primary"
      style={{ top: `${percentOf(minutes, range)}%` }}
    >
      <span className="absolute -top-[5px] -left-[5px] size-2 rounded-full bg-primary" />
    </div>
  )
}
