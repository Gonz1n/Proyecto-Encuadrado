import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { availabilityApi } from '../api/availability-api'
import type { SlotQuery } from '../types/availability'

export function useAvailableDays(slug: string, query: Partial<SlotQuery>) {
  const { service, professional } = query
  return useQuery({
    queryKey: queryKeys.availableDays(slug, { service, professional }),
    queryFn: () => availabilityApi.days(slug, { service: service!, professional: professional! }),
    enabled: service !== undefined && professional !== undefined,
  })
}

export function useAvailability(slug: string, query: Partial<SlotQuery> & { date?: string }) {
  const { service, professional, date } = query
  return useQuery({
    queryKey: queryKeys.availability(slug, { service, professional, date }),
    queryFn: () => availabilityApi.slots(slug, { service: service!, professional: professional!, date: date! }),
    enabled: service !== undefined && professional !== undefined && date !== undefined,
  })
}
