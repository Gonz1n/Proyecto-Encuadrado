import { createContext, use } from 'react'
import type { PublicCenter } from './api'
import type { BookingState } from './use-booking-state'
import type { Modality } from '@/lib/modality'

export type PatientDraft = {
  patient_name: string
  patient_email: string
  patient_phone: string
  patient_rut: string
  patient_birth_date: string
  modality: Modality
}

type BookingFlowContextValue = {
  slug: string
  center: PublicCenter
  state: BookingState
  patientDraft: PatientDraft
  savePatientDraft: (draft: PatientDraft) => void
}

export const BookingFlowContext = createContext<BookingFlowContextValue | null>(null)

export function useBookingFlow(): BookingFlowContextValue {
  const context = use(BookingFlowContext)
  if (!context) throw new Error('useBookingFlow debe usarse dentro de BookingFlow.Root')
  return context
}
