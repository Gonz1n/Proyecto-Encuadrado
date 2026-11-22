import { apiFetch } from '@/lib/api-client'
import type { Center, CenterUpdate, Closure, ClosureCreated, Member, Service, ServiceInput } from '../types/center'

export const centerApi = {
  get: (slug: string) => apiFetch<Center>(`/api/centers/${slug}/`),
  update: (slug: string, body: CenterUpdate) =>
    apiFetch<Center & { cancelled_appointments: number }>(`/api/centers/${slug}/`, { method: 'PATCH', body }),
  closures: (slug: string) => apiFetch<Closure[]>(`/api/centers/${slug}/closures/`),
  createClosure: (slug: string, body: { date: string; reason: string }) =>
    apiFetch<ClosureCreated>(`/api/centers/${slug}/closures/`, { method: 'POST', body }),
  deleteClosure: (slug: string, id: number) =>
    apiFetch<void>(`/api/centers/${slug}/closures/${id}/`, { method: 'DELETE' }),
  members: (slug: string) => apiFetch<Member[]>(`/api/centers/${slug}/members/`),
  services: (slug: string) => apiFetch<Service[]>(`/api/centers/${slug}/services/`),
  createService: (slug: string, body: ServiceInput) =>
    apiFetch<Service>(`/api/centers/${slug}/services/`, { method: 'POST', body }),
  updateService: (slug: string, id: number, body: Partial<ServiceInput>) =>
    apiFetch<Service>(`/api/centers/${slug}/services/${id}/`, { method: 'PATCH', body }),
  deleteService: (slug: string, id: number) =>
    apiFetch<void>(`/api/centers/${slug}/services/${id}/`, { method: 'DELETE' }),
}
