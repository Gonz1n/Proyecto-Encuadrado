import { formatDuration } from '@/utils/format'
import type { ServiceValues } from '../schemas/service-schema'

export const DURATION_OPTIONS = Array.from({ length: 16 }, (_, i) => {
  const minutes = (i + 1) * 15
  return { value: String(minutes), label: formatDuration(minutes) }
})

export const SERVICE_FIELDS: (keyof ServiceValues)[] = ['name', 'price_clp', 'duration_minutes', 'description']
