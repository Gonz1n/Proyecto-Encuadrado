import { useParams } from 'next/navigation'
import { useAuth } from '../contexts/auth-context'
import type { Membership } from '../types/auth'

export function useCurrentMembership(): Membership | undefined {
  const { slug } = useParams<{ slug: string }>()
  const { user } = useAuth()
  return user?.memberships.find((membership) => membership.center.slug === slug)
}
