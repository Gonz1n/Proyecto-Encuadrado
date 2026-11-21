import { addDays, format, isValid, parseISO, startOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'

export const SLOT_MINUTES = 30

export type View = 'lista' | 'semana' | 'dia'

type Range = { startMinutes: number; endMinutes: number }
type Span = { start: string; end: string }

export const DATE_FORMAT = 'yyyy-MM-dd'

const PALETTE = [
  'bg-sky-100 border-sky-400 text-sky-950 dark:bg-sky-950 dark:border-sky-700 dark:text-sky-100',
  'bg-emerald-100 border-emerald-400 text-emerald-950 dark:bg-emerald-950 dark:border-emerald-700 dark:text-emerald-100',
  'bg-amber-100 border-amber-400 text-amber-950 dark:bg-amber-950 dark:border-amber-700 dark:text-amber-100',
  'bg-rose-100 border-rose-400 text-rose-950 dark:bg-rose-950 dark:border-rose-700 dark:text-rose-100',
  'bg-violet-100 border-violet-400 text-violet-950 dark:bg-violet-950 dark:border-violet-700 dark:text-violet-100',
  'bg-teal-100 border-teal-400 text-teal-950 dark:bg-teal-950 dark:border-teal-700 dark:text-teal-100',
]

export function parseDateParam(value: string | null, fallback: Date): Date {
  if (!value) return fallback
  const parsed = parseISO(value)
  return isValid(parsed) && format(parsed, DATE_FORMAT) === value ? parsed : fallback
}

export function weekDays(reference: Date): Date[] {
  const monday = startOfWeek(reference, { weekStartsOn: 1 })
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i))
}

function minutesOfDay(iso: string): number {
  const date = parseISO(iso)
  return date.getHours() * 60 + date.getMinutes()
}

function clockMinutes(hhmm: string): number {
  const [hours, minutes] = hhmm.split(':').map(Number)
  return hours * 60 + minutes
}

export function visibleHourRange(opening: string, closing: string, appointments: Span[]): Range {
  let start = clockMinutes(opening)
  let end = clockMinutes(closing)
  for (const appointment of appointments) {
    start = Math.min(start, minutesOfDay(appointment.start))
    end = Math.max(end, minutesOfDay(appointment.end))
  }
  return {
    startMinutes: Math.floor(start / SLOT_MINUTES) * SLOT_MINUTES,
    endMinutes: Math.ceil(end / SLOT_MINUTES) * SLOT_MINUTES,
  }
}

export function blockPosition(start: string, end: string, range: Range): { top: number; height: number } {
  const total = range.endMinutes - range.startMinutes
  const from = minutesOfDay(start)
  return {
    top: ((from - range.startMinutes) / total) * 100,
    height: ((minutesOfDay(end) - from) / total) * 100,
  }
}

export function assignLanes<T extends { id: number; start: string; end: string }>(
  items: T[],
): { item: T; lane: number; lanes: number }[] {
  const sorted = [...items].sort((a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end))
  const result: { item: T; lane: number; lanes: number }[] = []
  let group: typeof result = []
  let laneEnds: string[] = []
  let groupEnd = ''

  const flush = () => {
    for (const entry of group) entry.lanes = laneEnds.length
    result.push(...group)
    group = []
    laneEnds = []
  }

  for (const item of sorted) {
    if (group.length && item.start >= groupEnd) flush()
    let lane = laneEnds.findIndex((end) => end <= item.start)
    if (lane === -1) lane = laneEnds.length
    laneEnds[lane] = item.end
    groupEnd = group.length && groupEnd > item.end ? groupEnd : item.end
    group.push({ item, lane, lanes: 0 })
  }
  flush()
  return result
}

export function professionalColor(id: number): string {
  return PALETTE[Math.abs(id) % PALETTE.length]
}

export function weekRangeLabel(first: Date, last: Date): string {
  const end = format(last, 'd MMM yyyy', { locale: es })
  if (first.getFullYear() !== last.getFullYear()) return `${format(first, 'd MMM yyyy', { locale: es })} – ${end}`
  if (first.getMonth() !== last.getMonth()) return `${format(first, 'd MMM', { locale: es })} – ${end}`
  return `${format(first, 'd')} – ${end}`
}

export function resolveView(param: string | null, viewAll: boolean): View {
  if (param === 'dia') return viewAll ? 'dia' : 'semana'
  return param === 'semana' ? 'semana' : 'lista'
}

type DayColumnSource = { id: number; full_name: string }

export function dayColumns(
  members: DayColumnSource[],
  appointments: { professional: DayColumnSource }[],
): { id: number; name: string }[] {
  const columns = new Map<number, string>()
  for (const member of members) columns.set(member.id, member.full_name)
  for (const { professional } of appointments) {
    if (!columns.has(professional.id)) columns.set(professional.id, professional.full_name)
  }
  return [...columns].map(([id, name]) => ({ id, name }))
}
