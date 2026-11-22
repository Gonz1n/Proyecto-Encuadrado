import type { QueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'

export function invalidateAvailability(queryClient: QueryClient, slug: string) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.allAvailability(slug) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.allAvailableDays(slug) }),
  ])
}

export function invalidateAgenda(queryClient: QueryClient, slug: string) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.allAppointments(slug) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.allAppointmentAvailability(slug) }),
  ])
}
