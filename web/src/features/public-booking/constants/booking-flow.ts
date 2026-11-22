import { ClipboardList, UserRound, type LucideIcon } from 'lucide-react'
import { EMPTY_PATIENT, PATIENT_FIELD_NAMES } from '@/features/patient/constants/patient-fields'
import type { PatientDraft } from '../types/booking'
import type { BookingStart, BookingStep } from '../types/booking-state'

export const EMPTY_DRAFT: PatientDraft = { ...EMPTY_PATIENT, modality: 'in_person', accept_terms: false, data_consent: false }

export const STEP_COPY: Record<BookingStep, { title: string; description: string }> = {
  start: { title: '¿Cómo quieres agendar?', description: 'Puedes partir por el servicio o por la persona que te atenderá.' },
  service: { title: 'Elige un servicio', description: 'Cada servicio indica su duración y precio.' },
  professional: { title: 'Elige un profesional', description: 'Después verás sus horas libres.' },
  slot: { title: 'Elige día y hora', description: 'Los días sin horas libres aparecen desactivados.' },
  patient: { title: 'Tus datos', description: 'Con estos datos el centro podrá contactarte.' },
}

export const START_OPTIONS: { value: BookingStart; label: string; description: string; icon: LucideIcon }[] = [
  { value: 'service', label: 'Por servicio', description: 'Elige primero la atención que necesitas.', icon: ClipboardList },
  { value: 'professional', label: 'Por profesional', description: 'Elige primero con quién quieres atenderte.', icon: UserRound },
]

export const PATIENT_STEP_FIELDS = [...PATIENT_FIELD_NAMES, 'accept_terms', 'data_consent'] as const
