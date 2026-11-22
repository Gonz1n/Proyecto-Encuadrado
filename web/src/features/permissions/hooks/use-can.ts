import { useCurrentMembership } from '@/features/auth/hooks/use-current-membership'
import type { Action } from '../types/permissions'
import { can, canManageAppointment } from '../utils/roles'

export function useCan(action: Action): boolean {
  const membership = useCurrentMembership()
  return membership ? can(membership.role, action) : false
}

export function useCanManageAppointment(appointment: { professional: { id: number } }): boolean {
  const membership = useCurrentMembership()
  return membership ? canManageAppointment(membership, appointment) : false
}
