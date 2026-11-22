import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CLP_FORMATTER } from '@/constants/currency'
import { WEEKDAY_NAMES, WEEKDAY_PLURAL } from '@/constants/dates'

export function formatCLP(n: number): string {
  return CLP_FORMATTER.format(n)
}

export function formatDuration(min: number): string {
  const hours = Math.floor(min / 60)
  const minutes = min % 60
  if (hours === 0) return `${minutes} min`
  if (minutes === 0) return `${hours} h`
  return `${hours} h ${minutes} min`
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function formatLongDate(date: Date): string {
  return capitalize(format(date, "EEEE d 'de' MMMM", { locale: es }))
}

export function formatOpenDays(days: number[]): string {
  const sorted = [...new Set(days)].sort((a, b) => a - b)
  if (sorted.length === 7) return 'todos los días'
  const consecutive = sorted.every((day, index) => index === 0 || day === sorted[index - 1] + 1)
  if (sorted.length > 1 && consecutive) {
    return `de ${WEEKDAY_NAMES[sorted[0]]} a ${WEEKDAY_NAMES[sorted[sorted.length - 1]]}`
  }
  const names = sorted.map((day) => WEEKDAY_PLURAL[day])
  const list = names.length > 1 ? `${names.slice(0, -1).join(', ')} y ${names.at(-1)}` : names[0]
  return `los ${list}`
}
