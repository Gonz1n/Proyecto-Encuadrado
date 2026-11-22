import { createContext, use } from 'react'
import type { PatientDraft, PublicCenter } from './api'
import type { BookingState } from './use-booking-state'

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
