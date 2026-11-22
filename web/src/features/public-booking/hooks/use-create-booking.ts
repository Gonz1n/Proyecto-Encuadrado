import { useMutation, useQueryClient } from '@tanstack/react-query'
import { invalidateAvailability } from '@/utils/query-invalidation'
import { publicBookingApi } from '../api/booking-api'
import { type BookingInput } from '../types/booking'

export function useCreateBooking(slug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: BookingInput) => publicBookingApi.book(slug, body),
    onSettled: () => invalidateAvailability(queryClient, slug),
  })
}
