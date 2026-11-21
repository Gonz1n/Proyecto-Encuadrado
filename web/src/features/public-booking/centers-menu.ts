import type { PublicCenterSummary } from './api'

export type CentersMenuItem = PublicCenterSummary & { current: boolean }

export function centersMenuItems(centers: PublicCenterSummary[], currentSlug: string): CentersMenuItem[] {
  return centers
    .map((center) => ({ ...center, current: center.slug === currentSlug }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }))
}
