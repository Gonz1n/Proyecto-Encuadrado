import type { SlotQuery } from '@/features/availability/types/availability'
import type { PatientValues } from '@/features/patient/types/patient'
import type { Modality } from '@/types/modality'

export type PatientDraft = PatientValues & { modality: Modality; accept_terms: boolean; data_consent: boolean }

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
