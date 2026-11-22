import { apiFetch } from '@/lib/api-client'
import type { CurrentUser } from '@/features/auth/types/auth'
import type { ProfileUpdate } from '../types/profile'

export const profileApi = {
  update: (body: ProfileUpdate) => apiFetch<CurrentUser>('/api/auth/me/', { method: 'PATCH', body }),
}
