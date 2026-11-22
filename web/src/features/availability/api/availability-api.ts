import { apiFetch } from '@/lib/api-client'
import type { SlotQuery } from '../types/availability'

const base = (slug: string) => `/api/public/centers/${slug}/availability`

export const availabilityApi = {
  days: (slug: string, { service, professional }: SlotQuery) =>
    apiFetch<{ days: string[] }>(
      `${base(slug)}/days/?${new URLSearchParams({ service: String(service), professional: String(professional) })}`,
    ),
  slots: (slug: string, { service, professional, date }: SlotQuery & { date: string }) =>
    apiFetch<{ date: string; slots: string[] }>(
      `${base(slug)}/?${new URLSearchParams({ service: String(service), professional: String(professional), date })}`,
    ),
}
