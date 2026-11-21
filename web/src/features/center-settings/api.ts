import { apiFetch } from '@/lib/api-client'
import type { Role } from '@/features/permissions/roles'
import type { SocialLinks } from '@/lib/social-links'

export type Center = {
  name: string
  slug: string
  description: string
  opening_time: string
  closing_time: string
  terms: string
  open_days: number[]
} & SocialLinks

export type CenterUpdate = Partial<Omit<Center, 'slug' | 'terms'>>

export type Service = {
  id: number
  name: string
  price_clp: number
  duration_minutes: number
}

export type ServiceInput = Omit<Service, 'id'>

export type Member = {
  id: number
  role: Role
  role_label: string
  user: { full_name: string; email: string; title: string; avatar_url: string }
}

export const centerApi = {
  get: (slug: string) => apiFetch<Center>(`/api/centers/${slug}/`),
  update: (slug: string, body: CenterUpdate) =>
    apiFetch<Center>(`/api/centers/${slug}/`, { method: 'PATCH', body }),
  members: (slug: string) => apiFetch<Member[]>(`/api/centers/${slug}/members/`),
  services: (slug: string) => apiFetch<Service[]>(`/api/centers/${slug}/services/`),
  createService: (slug: string, body: ServiceInput) =>
    apiFetch<Service>(`/api/centers/${slug}/services/`, { method: 'POST', body }),
  updateService: (slug: string, id: number, body: Partial<ServiceInput>) =>
    apiFetch<Service>(`/api/centers/${slug}/services/${id}/`, { method: 'PATCH', body }),
  deleteService: (slug: string, id: number) =>
    apiFetch<void>(`/api/centers/${slug}/services/${id}/`, { method: 'DELETE' }),
}
