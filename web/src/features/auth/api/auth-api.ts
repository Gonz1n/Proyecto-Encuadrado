import { apiFetch } from '@/lib/api-client'
import type { CurrentUser } from '../types/auth'

type LoginResponse = { user: CurrentUser }

export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<LoginResponse>('/api/auth/login/', { method: 'POST', body: { email, password } }),
  logout: () => apiFetch<void>('/api/auth/logout/', { method: 'POST' }),
  me: () => apiFetch<CurrentUser>('/api/auth/me/'),
}
