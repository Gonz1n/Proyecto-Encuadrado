import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { ApiError } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import {
  centerApi,
  type CenterUpdate,
  type ServiceInput,
} from './api'

export function useCenter(slug: string) {
  return useQuery({ queryKey: queryKeys.center(slug), queryFn: () => centerApi.get(slug) })
}

export function useMembers(slug: string) {
  return useQuery({ queryKey: queryKeys.members(slug), queryFn: () => centerApi.members(slug) })
}

export function useServices(slug: string) {
  return useQuery({ queryKey: queryKeys.services(slug), queryFn: () => centerApi.services(slug) })
}

export function useUpdateCenter(slug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CenterUpdate) => centerApi.update(slug, body),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.center(slug) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.publicCenter(slug) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.me }),
      ]),
  })
}

function useServiceMutation<TVariables>(
  slug: string,
  mutationFn: (variables: TVariables) => Promise<unknown>,
) {
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

export function handleMutationError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
) {
  if (error instanceof ApiError && error.status === 403) {
    toast.error('No tienes permisos para esta acción')
    return
  }
  if (error instanceof ApiError && error.status === 400 && error.data) {
    const data = error.data as Record<string, unknown>
    let mapped = false
    for (const field of fields) {
      const messages = data[field]
      if (Array.isArray(messages) && messages.length > 0) {
        setError(field, { message: String(messages[0]) })
        mapped = true
      }
    }
    if (mapped) return
  }
  toast.error('No pudimos guardar los cambios. Intenta de nuevo.')
}

export function notifyDeleteError(error: unknown) {
  toast.error(
    error instanceof ApiError && error.status === 403
      ? 'No tienes permisos para esta acción'
      : 'No pudimos eliminar el servicio. Intenta de nuevo.',
  )
}
