import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { centerApi } from '../api/center-api'
import type { CenterUpdate } from '../types/center'
import { invalidateSchedule } from '../utils/invalidate-schedule'

export function useCenter(slug: string) {
  return useQuery({ queryKey: queryKeys.center(slug), queryFn: () => centerApi.get(slug) })
}

export function useUpdateCenter(slug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CenterUpdate) => centerApi.update(slug, body),
    onSuccess: () =>
      Promise.all([
        invalidateSchedule(queryClient, slug),
        queryClient.invalidateQueries({ queryKey: queryKeys.publicCenter(slug) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.me }),
      ]),
  })
}
