import { apiFetch } from '@/lib/api-client'
import type { Role } from '@/features/permissions/roles'

export type Membership = {
  id: number
  role: Role
  role_label: string
  center: { slug: string; name: string }
}

export type CurrentUser = {
  id: number
  email: string
  first_name: string
  last_name: string
  full_name: string
  title: string
  university: string
  bio: string
  health_registry: string
  memberships: Membership[]
}

export type ProfileUpdate = Pick<
  CurrentUser,
  'first_name' | 'last_name' | 'title' | 'university' | 'bio' | 'health_registry'
>

type LoginResponse = { user: CurrentUser }

export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<LoginResponse>('/api/auth/login/', {
      method: 'POST',
      body: { email, password },
    }),
  logout: () => apiFetch<void>('/api/auth/logout/', { method: 'POST' }),
  me: () => apiFetch<CurrentUser>('/api/auth/me/'),
  updateProfile: (body: ProfileUpdate) =>
    apiFetch<CurrentUser>('/api/auth/me/', { method: 'PATCH', body }),
}
