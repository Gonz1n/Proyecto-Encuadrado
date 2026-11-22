import type { Role } from '@/features/permissions/types/permissions'

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
