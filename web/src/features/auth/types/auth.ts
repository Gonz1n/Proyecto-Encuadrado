import type { Role } from '@/features/permissions/types/permissions'
import type { components } from '@/types/api'

type Schemas = components['schemas']

export type Membership = Omit<Schemas['MembershipOut'], 'role'> & { role: Role }

export type CurrentUser = Omit<Schemas['UserOut'], 'memberships'> & { memberships: Membership[] }
