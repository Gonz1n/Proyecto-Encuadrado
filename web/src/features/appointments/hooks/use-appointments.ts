import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { queryKeys } from '@/lib/query-keys'
import { invalidateAvailability } from '@/utils/query-invalidation'
import { appointmentsApi } from '../api/appointments-api'
import type { AppointmentFilters, CreateAppointmentInput } from '../types/appointment'

export function useAppointments(slug: string, filters: AppointmentFilters) {
  return useQuery({ queryKey: queryKeys.appointments(slug, filters), queryFn: () => appointmentsApi.list(slug, filters) })
}

export function useCreateAppointment(slug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateAppointmentInput) => appointmentsApi.create(slug, body),
    onSuccess: () => {
      toast.success('Hora agendada')
    },
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.allAppointments(slug) }),
        invalidateAvailability(queryClient, slug),
      ]),
  })
}
