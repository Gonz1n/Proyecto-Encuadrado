import type { Membership } from '@/features/auth/types/auth'

export function selectableProfessionals<T extends { id: number }>(membership: Membership, professionals: T[]): T[] {
  if (membership.role === 'admin') return professionals
  if (membership.role === 'member') return professionals.filter((professional) => professional.id === membership.id)
  return []
}
