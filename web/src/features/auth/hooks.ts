import { useQuery } from '@tanstack/react-query'
import { ApiError } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import { authApi } from './api'

export function isUnauthorized(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401
}

export function useMeQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: authApi.me,
    enabled,
    staleTime: 5 * 60 * 1000,
  })
}
