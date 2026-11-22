import type { components } from '@/types/api'

export type SlotQuery = { service: number; professional: number }

export type AvailableDays = components['schemas']['DaysOut']

export type AvailableSlots = components['schemas']['SlotsOut']
