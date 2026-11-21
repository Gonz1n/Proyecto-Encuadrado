import type { Booking } from './api'

const KEY = 'encuadrado.booking'

export function saveBooking(booking: Booking): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(booking))
  } catch {
    return
  }
}

export function readBooking(slug: string): Booking | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    const booking = JSON.parse(raw) as Booking | null
    return booking?.center?.slug === slug ? booking : null
  } catch {
    return null
  }
}
