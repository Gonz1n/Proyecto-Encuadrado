import { format, subYears } from 'date-fns'
import { DATE_FORMAT } from '@/constants/dates'

export function birthDateBounds(now: Date = new Date()): { today: string; oldest: string } {
  return { today: format(now, DATE_FORMAT), oldest: format(subYears(now, 120), DATE_FORMAT) }
}
