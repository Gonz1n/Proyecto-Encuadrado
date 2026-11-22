import type { SlotQuery } from '@/features/availability/types/availability'
import type { PatientValues } from '@/features/patient/types/patient'
import type { components } from '@/types/api'
import type { Modality } from '@/types/modality'

type Schemas = components['schemas']

export type PatientDraft = PatientValues & { modality: Modality; accept_terms: boolean; data_consent: boolean }

export type BookingInput = Omit<Schemas['PublicBookingIn'], 'service' | 'professional'> & SlotQuery

export type Booking = Omit<Schemas['BookingOut'], 'modality'> & { modality: Modality }
