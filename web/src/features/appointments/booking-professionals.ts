import type { Membership } from '@/features/auth/api'

export function selectableProfessionals<T extends { id: number }>(membership: Membership, professionals: T[]): T[] {
  if (membership.role === 'admin') return professionals
  if (membership.role === 'member') return professionals.filter((professional) => professional.id === membership.id)
  return []
}
