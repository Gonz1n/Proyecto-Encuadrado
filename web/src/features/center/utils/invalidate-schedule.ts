import type { QueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { invalidateAgenda, invalidateAvailability } from '@/utils/query-invalidation'

export function invalidateSchedule(queryClient: QueryClient, slug: string) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.center(slug) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.closures(slug) }),
    invalidateAgenda(queryClient, slug),
    invalidateAvailability(queryClient, slug),
  ])
}
