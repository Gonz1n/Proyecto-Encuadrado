import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { centerApi } from '../api/center-api'

export function useMembers(slug: string) {
  return useQuery({ queryKey: queryKeys.members(slug), queryFn: () => centerApi.members(slug) })
}
