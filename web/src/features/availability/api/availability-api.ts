import { apiFetch } from '@/lib/api-client'
import type { AvailableDays, AvailableSlots, SlotQuery } from '../types/availability'

const base = (slug: string) => `/api/public/centers/${slug}/availability`

export const availabilityApi = {
  days: (slug: string, { service, professional }: SlotQuery) =>
    apiFetch<AvailableDays>(
      `${base(slug)}/days/?${new URLSearchParams({ service: String(service), professional: String(professional) })}`,
    ),
  slots: (slug: string, { service, professional, date }: SlotQuery & { date: string }) =>
    apiFetch<AvailableSlots>(
      `${base(slug)}/?${new URLSearchParams({ service: String(service), professional: String(professional), date })}`,
    ),
}
