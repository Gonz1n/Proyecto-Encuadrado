import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { authApi } from '../api/auth-api'

export function useMeQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: authApi.me,
    enabled,
    staleTime: 5 * 60 * 1000,
  })
}
