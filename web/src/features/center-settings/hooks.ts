import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { centerApi, type CenterUpdate, type ServiceInput } from './api'
import { invalidateAgenda, invalidateAvailability } from '@/utils/query-invalidation'

export function useCenter(slug: string) {
  return useQuery({ queryKey: queryKeys.center(slug), queryFn: () => centerApi.get(slug) })
}

export function useMembers(slug: string) {
  return useQuery({ queryKey: queryKeys.members(slug), queryFn: () => centerApi.members(slug) })
}

export function useServices(slug: string) {
  return useQuery({ queryKey: queryKeys.services(slug), queryFn: () => centerApi.services(slug) })
}

export function useClosures(slug: string) {
  return useQuery({ queryKey: queryKeys.closures(slug), queryFn: () => centerApi.closures(slug) })
}

function invalidateSchedule(queryClient: QueryClient, slug: string) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.center(slug) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.closures(slug) }),
    invalidateAgenda(queryClient, slug),
    invalidateAvailability(queryClient, slug),
  ])
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

export function useCreateClosure(slug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: { date: string; reason: string }) => centerApi.createClosure(slug, body),
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

function useServiceMutation<TVariables>(slug: string, mutationFn: (variables: TVariables) => Promise<unknown>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.services(slug) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.publicCenter(slug) }),
      ]),
  })
}

export function useCreateService(slug: string) {
  return useServiceMutation(slug, (body: ServiceInput) => centerApi.createService(slug, body))
}

export function useUpdateService(slug: string) {
  return useServiceMutation(slug, ({ id, body }: { id: number; body: Partial<ServiceInput> }) =>
    centerApi.updateService(slug, id, body),
  )
}

export function useDeleteService(slug: string) {
  return useServiceMutation(slug, (id: number) => centerApi.deleteService(slug, id))
}
