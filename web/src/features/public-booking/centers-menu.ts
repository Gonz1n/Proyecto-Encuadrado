import type { PublicCenterSummary } from './api'

type CentersMenuItem = PublicCenterSummary & { current: boolean }

export function centersMenuItems(centers: PublicCenterSummary[], currentSlug: string): CentersMenuItem[] {
  return centers
    .map((center) => ({ ...center, current: center.slug === currentSlug }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }))
}

type CentersMenuState = 'items' | 'loading' | 'error'

export function centersMenuState(query: { isError: boolean; hasData: boolean }): CentersMenuState {
  if (query.hasData) return 'items'
  return query.isError ? 'error' : 'loading'
}

export function shouldRefetchCenters(query: { isError: boolean; hasData: boolean; isFetching: boolean }): boolean {
  return !query.isFetching && (query.isError || !query.hasData)
}
