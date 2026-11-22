import { apiFetch } from '@/lib/api-client'
import type { SlotQuery } from '@/features/availability/types/availability'
import type { PatientFieldName } from '@/features/patient/patient-fields'
import type { Modality } from '@/types/modality'

export type PatientDraft = Record<PatientFieldName, string> & { modality: Modality; accept_terms: boolean; data_consent: boolean }

export type BookingInput = SlotQuery & PatientDraft & { start: string }

export type Booking = {
  id: number
  center: { name: string; slug: string }
  professional: { full_name: string }
  service: { name: string; price_clp: number }
  start: string
  end: string
  modality: Modality
}

export const publicBookingApi = {
  book: (slug: string, body: BookingInput) =>
    apiFetch<Booking>(`/api/public/centers/${slug}/appointments/`, { method: 'POST', body }),
}
