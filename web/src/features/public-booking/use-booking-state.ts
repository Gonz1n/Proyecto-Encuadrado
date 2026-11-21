import { format, isValid, parseISO } from 'date-fns'
import { useSearchParams } from 'next/navigation'
import { useSetSearchParams } from '@/lib/use-set-search-params'
import type { PublicCenter, PublicProfessional, PublicService } from './api'

export type BookingStart = 'service' | 'professional'
export type BookingStep = 'start' | 'service' | 'professional' | 'slot' | 'patient'

export type BookingPatch = {
  by?: BookingStart | null
  service?: number | null
  professional?: number | null
  date?: string | null
  time?: string | null
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

function readId(params: URLSearchParams, key: string): number | null {
  const value = Number(params.get(key))
  return Number.isInteger(value) && value > 0 ? value : null
}

export function validDate(value: string | null): string | null {
  if (!value || !DATE_PATTERN.test(value)) return null
  const parsed = parseISO(value)
  return isValid(parsed) && format(parsed, 'yyyy-MM-dd') === value ? value : null
}

export function validTime(value: string | null): string | null {
  return value && TIME_PATTERN.test(value) ? value : null
}

function readBy(params: URLSearchParams): BookingStart | null {
  const value = params.get('by')
  return value === 'service' || value === 'professional' ? value : null
}

export function applyPatch(current: URLSearchParams, patch: BookingPatch): URLSearchParams {
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

export function firstChoice(
  by: BookingStart | null,
  service: PublicService | undefined,
  professional: PublicProfessional | undefined,
): BookingStart | null {
  return by ?? (service ? 'service' : professional ? 'professional' : null)
}

export function deriveStep(
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
  const first = firstChoice(by, service, professional)
  const step = deriveStep(first, service, professional, date, time)

  const update = (patch: BookingPatch, options?: { replace?: boolean }) =>
    setParams((current) => applyPatch(current, patch), options)

  const hrefFor = (patch: BookingPatch) => `?${applyPatch(params, patch)}`

  return { by, first, service, professional, date, time, step, update, hrefFor }
}

export type BookingState = ReturnType<typeof useBookingState>
