import { apiFetch } from '@/lib/api-client'
import type { Booking, BookingInput } from '../types/booking'

export const publicBookingApi = {
  book: (slug: string, body: BookingInput) =>
    apiFetch<Booking>(`/api/public/centers/${slug}/appointments/`, { method: 'POST', body }),
}
