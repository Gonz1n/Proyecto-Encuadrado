import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { centerApi } from '../api/center-api'
import type { ServiceInput, ServiceUpdate } from '../types/center'

export function useServices(slug: string) {
  return useQuery({ queryKey: queryKeys.services(slug), queryFn: () => centerApi.services(slug) })
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
  return useServiceMutation(slug, ({ id, body }: { id: number; body: ServiceUpdate }) =>
    centerApi.updateService(slug, id, body),
  )
}

export function useDeleteService(slug: string) {
  return useServiceMutation(slug, (id: number) => centerApi.deleteService(slug, id))
}
