import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { publicBookingApi, type BookingInput, type SlotQuery } from './api'
import { isNotFound } from '@/utils/api-errors'
import { invalidateAvailability } from '@/utils/query-invalidation'

export function usePublicCenter(slug: string) {
  return useQuery({
    queryKey: queryKeys.publicCenter(slug),
    queryFn: () => publicBookingApi.center(slug),
    retry: (failureCount, error) => !isNotFound(error) && failureCount < 1,
  })
}

export function usePublicCenters() {
  return useQuery({
    queryKey: queryKeys.publicCenters,
    queryFn: publicBookingApi.centers,
    staleTime: 5 * 60 * 1000,
  })
}

export function useAvailableDays(slug: string, query: Partial<SlotQuery>) {
  const { service, professional } = query
  return useQuery({
    queryKey: queryKeys.availableDays(slug, { service, professional }),
    queryFn: () => publicBookingApi.availableDays(slug, { service: service!, professional: professional! }),
    enabled: service !== undefined && professional !== undefined,
  })
}

export function useAvailability(slug: string, query: Partial<SlotQuery> & { date?: string }) {
  const { service, professional, date } = query
  return useQuery({
    queryKey: queryKeys.availability(slug, { service, professional, date }),
    queryFn: () =>
      publicBookingApi.availability(slug, { service: service!, professional: professional!, date: date! }),
    enabled: service !== undefined && professional !== undefined && date !== undefined,
  })
}

export function useCreateBooking(slug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: BookingInput) => publicBookingApi.book(slug, body),
    onSettled: () => invalidateAvailability(queryClient, slug),
  })
}
