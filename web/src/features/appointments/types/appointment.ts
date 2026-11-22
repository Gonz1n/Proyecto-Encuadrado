import type { PatientFieldName } from '@/features/patient/patient-fields'
import type { Modality } from '@/types/modality'

export type AppointmentChange = {
  kind: 'rescheduled' | 'cancelled'
  previous_start: string
  new_start: string | null
  note: string
  changed_by: { full_name: string } | null
  created_at: string
}

export type Appointment = {
  id: number
  start: string
  end: string
  status: string
  service: { id: number; name: string; price_clp: number }
  professional: { id: number; full_name: string }
  patient_name: string
  patient_email: string
  patient_phone: string
  patient_rut: string
  patient_birth_date: string | null
  modality: Modality
  changes: AppointmentChange[]
}

export type AppointmentFilters = {
  from: string
  to: string
  professional?: number
  include_cancelled?: boolean
}

export type CreateAppointmentInput = Record<PatientFieldName, string> & {
  service: number
  professional: number
  start: string
  modality: Modality
}

export type RescheduleInput = { start: string; note?: string }
