import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { isNotFound } from '@/utils/api-errors'
import { publicCenterApi } from '../api/public-center-api'

export function usePublicCenter(slug: string) {
  return useQuery({
    queryKey: queryKeys.publicCenter(slug),
    queryFn: () => publicCenterApi.center(slug),
    retry: (failureCount, error) => !isNotFound(error) && failureCount < 1,
  })
}

export function usePublicCenters() {
  return useQuery({
    queryKey: queryKeys.publicCenters,
    queryFn: publicCenterApi.centers,
    staleTime: 5 * 60 * 1000,
  })
}
