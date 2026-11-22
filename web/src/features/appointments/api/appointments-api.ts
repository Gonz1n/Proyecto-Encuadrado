import { apiFetch } from '@/lib/api-client'
import type { Appointment, AppointmentFilters, CreateAppointmentInput, RescheduleInput } from '../types/appointment'

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
