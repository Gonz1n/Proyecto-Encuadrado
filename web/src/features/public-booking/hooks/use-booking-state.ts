import { format, isValid, parseISO } from 'date-fns'
import { useSearchParams } from 'next/navigation'
import { DATE_FORMAT } from '@/constants/dates'
import type { PublicCenter, PublicProfessional, PublicService } from '@/features/center/types/public-center'
import { useSetSearchParams } from '@/hooks/use-set-search-params'
import { DATE_PATTERN, TIME_PATTERN } from '../constants/patterns'
import type { BookingPatch, BookingStart, BookingStep } from '../types/booking-state'

function readId(params: URLSearchParams, key: string): number | null {
  const value = Number(params.get(key))
  return Number.isInteger(value) && value > 0 ? value : null
}

function validDate(value: string | null): string | null {
  if (!value || !DATE_PATTERN.test(value)) return null
  const parsed = parseISO(value)
  return isValid(parsed) && format(parsed, DATE_FORMAT) === value ? value : null
}

function validTime(value: string | null): string | null {
  return value && TIME_PATTERN.test(value) ? value : null
}

function readBy(params: URLSearchParams): BookingStart | null {
  const value = params.get('by')
  return value === 'service' || value === 'professional' ? value : null
}

function applyPatch(current: URLSearchParams, patch: BookingPatch): URLSearchParams {
  const next = new URLSearchParams(current)
  const changes: BookingPatch =
    'service' in patch || 'professional' in patch ? { date: null, time: null, ...patch } : { ...patch }
  if (changes.date !== undefined && changes.time === undefined) changes.time = null
  for (const [key, value] of Object.entries(changes)) {
    if (value === null || value === undefined) next.delete(key)
    else next.set(key, String(value))
  }
  return next
}

function deriveStep(
  first: BookingStart | null,
  service: PublicService | undefined,
  professional: PublicProfessional | undefined,
  date: string | null,
  time: string | null,
): BookingStep {
  if (!first) return 'start'
  const chosen = { service, professional }
  if (!chosen[first]) return first
  const other = first === 'service' ? 'professional' : 'service'
  if (!chosen[other]) return other
  if (!date || !time) return 'slot'
  return 'patient'
}

export function useBookingState(center: PublicCenter) {
  const params = useSearchParams()
  const setParams = useSetSearchParams()
  const by = readBy(params)
  const service = center.services.find((item) => item.id === readId(params, 'service'))
  const professional = center.professionals.find((item) => item.id === readId(params, 'professional'))
  const date = validDate(params.get('date'))
  const time = validTime(params.get('time'))
  const first = by ?? (service ? 'service' : professional ? 'professional' : null)
  const step = deriveStep(first, service, professional, date, time)

  const update = (patch: BookingPatch, options?: { replace?: boolean }) =>
    setParams((current) => applyPatch(current, patch), options)

  const hrefFor = (patch: BookingPatch) => `?${applyPatch(params, patch)}`

  return { by, first, service, professional, date, time, step, update, hrefFor }
}

export type BookingState = ReturnType<typeof useBookingState>
