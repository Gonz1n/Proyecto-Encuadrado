import { useMutation, useQueryClient } from '@tanstack/react-query'
import { invalidateAvailability } from '@/utils/query-invalidation'
import { publicBookingApi, type BookingInput } from './api'

export function useCreateBooking(slug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: BookingInput) => publicBookingApi.book(slug, body),
    onSettled: () => invalidateAvailability(queryClient, slug),
  })
}
