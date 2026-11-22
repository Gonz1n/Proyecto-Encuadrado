import { BOOKING_STORAGE_KEY } from '../constants/storage'
import type { Booking } from '../types/booking'

export function saveBooking(booking: Booking): void {
  try {
    sessionStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(booking))
  } catch {
    return
  }
}

export function readBooking(slug: string): Booking | null {
  try {
    const raw = sessionStorage.getItem(BOOKING_STORAGE_KEY)
    if (!raw) return null
    const booking = JSON.parse(raw) as Booking | null
    return booking?.center?.slug === slug ? booking : null
  } catch {
    return null
  }
}
