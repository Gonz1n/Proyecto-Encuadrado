import type { components } from '@/types/api'
import type { Modality } from '@/types/modality'

type Schemas = components['schemas']

export type AppointmentChange = Omit<Schemas['ChangeOut'], 'kind'> & { kind: 'rescheduled' | 'cancelled' }

export type Appointment = Omit<Schemas['AppointmentOut'], 'modality' | 'changes'> & {
  modality: Modality
  changes: AppointmentChange[]
}

export type AppointmentFilters = {
  from: string
  to: string
  professional?: number
  include_cancelled?: boolean
}

export type CreateAppointmentInput = Omit<Schemas['StaffBookingIn'], 'service' | 'professional'> & {
  service: number
  professional: number
}

export type RescheduleInput = Schemas['RescheduleIn']
