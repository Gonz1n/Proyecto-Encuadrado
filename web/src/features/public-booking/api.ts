import { apiFetch } from '@/lib/api-client'
import type { SocialLinks } from '@/lib/social-links'
import type { Modality } from '@/lib/modality'

export type PublicProfessional = {
  id: number
  full_name: string
  title: string
  avatar_url: string
  university: string
  bio: string
  health_registry: string
}

export type PublicService = {
  id: number
  name: string
  price_clp: number
  duration_minutes: number
  description: string
}

export type PublicCenterSummary = {
  slug: string
  name: string
  description: string
}

export type PublicCenter = {
  name: string
  slug: string
  description: string
  opening_time: string
  closing_time: string
  terms: string
  open_days: number[]
  professionals: PublicProfessional[]
  services: PublicService[]
  address: string
  commune: string
  phone: string
  email: string
} & SocialLinks

export type SlotQuery = { service: number; professional: number }

export type BookingInput = SlotQuery & {
  start: string
  patient_name: string
  patient_email: string
  patient_phone: string
  patient_rut: string
  patient_birth_date: string
  modality: Modality
}

export type Booking = {
  id: number
  center: { name: string; slug: string }
  professional: { full_name: string }
  service: { name: string; price_clp: number }
  start: string
  end: string
  modality: Modality
}

const base = (slug: string) => `/api/public/centers/${slug}`

export const publicBookingApi = {
  centers: () => apiFetch<PublicCenterSummary[]>('/api/public/centers/'),
  center: (slug: string) => apiFetch<PublicCenter>(`${base(slug)}/`),
  availableDays: (slug: string, query: SlotQuery) =>
    apiFetch<{ days: string[] }>(
      `${base(slug)}/availability/days/?${new URLSearchParams({
        service: String(query.service),
        professional: String(query.professional),
      })}`,
    ),
  availability: (slug: string, query: SlotQuery & { date: string }) =>
    apiFetch<{ date: string; slots: string[] }>(
      `${base(slug)}/availability/?${new URLSearchParams({
        service: String(query.service),
        professional: String(query.professional),
        date: query.date,
      })}`,
    ),
  book: (slug: string, body: BookingInput) =>
    apiFetch<Booking>(`${base(slug)}/appointments/`, { method: 'POST', body }),
}
