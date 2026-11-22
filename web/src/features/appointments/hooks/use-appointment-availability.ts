import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { appointmentsApi } from '../api/appointments-api'

export function useAppointmentAvailableDays(slug: string, id: number) {
  return useQuery({ queryKey: queryKeys.appointmentDays(slug, id), queryFn: () => appointmentsApi.availabilityDays(slug, id) })
}

export function useAppointmentAvailability(slug: string, id: number, date: string | undefined) {
  return useQuery({
    queryKey: queryKeys.appointmentSlots(slug, id, date ?? ''),
    queryFn: () => appointmentsApi.availability(slug, id, date!),
    enabled: date !== undefined,
  })
}
