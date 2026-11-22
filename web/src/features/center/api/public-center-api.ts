import { apiFetch } from '@/lib/api-client'
import type { PublicCenter, PublicCenterSummary } from '../types/public-center'

export const publicCenterApi = {
  centers: () => apiFetch<PublicCenterSummary[]>('/api/public/centers/'),
  center: (slug: string) => apiFetch<PublicCenter>(`/api/public/centers/${slug}/`),
}
