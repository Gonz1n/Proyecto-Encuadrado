import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { centerApi } from '../api/center-api'
import type { ClosureInput } from '../types/center'
import { invalidateSchedule } from '../utils/invalidate-schedule'

export function useClosures(slug: string) {
  return useQuery({ queryKey: queryKeys.closures(slug), queryFn: () => centerApi.closures(slug) })
}

export function useCreateClosure(slug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: ClosureInput) => centerApi.createClosure(slug, body),
    onSuccess: () => invalidateSchedule(queryClient, slug),
  })
}

export function useDeleteClosure(slug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => centerApi.deleteClosure(slug, id),
    onSuccess: () => invalidateSchedule(queryClient, slug),
  })
}
