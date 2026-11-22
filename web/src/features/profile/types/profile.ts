import type { CurrentUser } from '@/features/auth/types/auth'

export type ProfileUpdate = Pick<CurrentUser, 'first_name' | 'last_name' | 'title' | 'university' | 'bio' | 'health_registry'>
