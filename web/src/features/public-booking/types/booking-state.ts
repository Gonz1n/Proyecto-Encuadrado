export type BookingStart = 'service' | 'professional'

export type BookingStep = 'start' | 'service' | 'professional' | 'slot' | 'patient'

export type BookingPatch = {
  by?: BookingStart | null
  service?: number | null
  professional?: number | null
  date?: string | null
  time?: string | null
}
