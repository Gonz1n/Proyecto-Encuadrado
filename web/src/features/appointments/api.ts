import { apiFetch } from '@/lib/api-client'
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

const detailPath = (slug: string, id: number) => `/api/centers/${slug}/appointments/${id}/`

export const appointmentsApi = {
  list: (slug: string, filters: AppointmentFilters) => {
    const params = new URLSearchParams({ from: filters.from, to: filters.to })
    if (filters.professional) params.set('professional', String(filters.professional))
    if (filters.include_cancelled) params.set('include_cancelled', 'true')
    return apiFetch<Appointment[]>(`/api/centers/${slug}/appointments/?${params}`)
  },
  create: (slug: string, body: CreateAppointmentInput) =>
    apiFetch<Appointment>(`/api/centers/${slug}/appointments/`, { method: 'POST', body }),
  reschedule: (slug: string, id: number, body: RescheduleInput) =>
    apiFetch<Appointment>(detailPath(slug, id), { method: 'PATCH', body }),
  cancel: (slug: string, id: number, note: string) =>
    apiFetch<Appointment>(`${detailPath(slug, id)}cancel/`, { method: 'POST', body: { note } }),
  availabilityDays: (slug: string, id: number) =>
    apiFetch<{ days: string[] }>(`${detailPath(slug, id)}availability/days/`),
  availability: (slug: string, id: number, date: string) =>
    apiFetch<{ date: string; slots: string[] }>(`${detailPath(slug, id)}availability/?date=${date}`),
}
