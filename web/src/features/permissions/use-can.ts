import { useParams } from 'next/navigation'
import { useAuth } from '@/features/auth/auth-context'
import type { Membership } from '@/features/auth/api'
import type { Appointment } from '@/features/appointments/api'
import { can, canManageAppointment, type Action } from './roles'

export function useCurrentMembership(): Membership | undefined {
  const { slug } = useParams<{ slug: string }>()
  const { user } = useAuth()
  return user?.memberships.find((membership) => membership.center.slug === slug)
}

export function useCan(action: Action): boolean {
  const membership = useCurrentMembership()
  return membership ? can(membership.role, action) : false
}

export function useCanManageAppointment(appointment: Appointment): boolean {
  const membership = useCurrentMembership()
  return membership ? canManageAppointment(membership, appointment) : false
}
