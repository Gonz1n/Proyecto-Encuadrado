import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { queryKeys } from '@/lib/query-keys'
import { appointmentsApi, type AppointmentFilters, type CreateAppointmentInput, type RescheduleInput } from './api'
import { isApiError } from '@/utils/api-errors'
import { FORBIDDEN_MESSAGE, SLOT_TAKEN_MESSAGE } from '@/constants/messages'
import { invalidateAgenda, invalidateAvailability } from '@/utils/query-invalidation'

export function useAppointments(slug: string, filters: AppointmentFilters) {
  return useQuery({ queryKey: queryKeys.appointments(slug, filters), queryFn: () => appointmentsApi.list(slug, filters) })
}

export const NOTE_MAX = 300

function useManageMutation<TVariables>(
  slug: string,
  mutationFn: (variables: TVariables) => Promise<unknown>,
  successMessage: string,
  onDone: () => void,
  onConflict?: () => void,
) {
  const queryClient = useQueryClient()
  const invalidate = () => invalidateAgenda(queryClient, slug)
  return useMutation({
    mutationFn,
    onSuccess: async () => {
      toast.success(successMessage)
      onDone()
      await invalidate()
    },
    onError: (error) => {
      if (isApiError(error, 409)) {
        toast.error(SLOT_TAKEN_MESSAGE)
        onConflict?.()
        return
      }
      if (isApiError(error, 404)) {
        toast.error('La cita ya fue modificada o cancelada')
        onDone()
        void invalidate()
        return
      }
      if (isApiError(error, 400)) {
        const data = (error.data ?? {}) as Record<string, unknown>
        const message = [data.detail, data.start, data.note].flat().find((value) => typeof value === 'string')
        if (message) {
          toast.error(message as string)
          return
        }
      }
      if (isApiError(error, 403)) {
        toast.error(FORBIDDEN_MESSAGE)
        return
      }
      toast.error('No pudimos completar la acción. Intenta de nuevo.')
    },
  })
}

export function useRescheduleAppointment(slug: string, id: number, onDone: () => void, onConflict?: () => void) {
  const queryClient = useQueryClient()
  return useManageMutation(
    slug,
    (body: RescheduleInput) => appointmentsApi.reschedule(slug, id, body),
    'Cita reagendada',
    onDone,
    () => {
      onConflict?.()
      return queryClient.invalidateQueries({ queryKey: queryKeys.appointmentAvailability(slug, id) })
    },
  )
}

export function useCancelAppointment(slug: string, id: number, onDone: () => void) {
  return useManageMutation(slug, (note: string) => appointmentsApi.cancel(slug, id, note), 'Cita cancelada', onDone)
}

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
