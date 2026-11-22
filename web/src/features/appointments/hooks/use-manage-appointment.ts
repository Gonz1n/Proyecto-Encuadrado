import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { FORBIDDEN_MESSAGE, SLOT_TAKEN_MESSAGE } from '@/constants/messages'
import { queryKeys } from '@/lib/query-keys'
import { isApiError } from '@/utils/api-errors'
import { invalidateAgenda } from '@/utils/query-invalidation'
import { appointmentsApi } from '../api/appointments-api'
import { ACTION_ERROR_MESSAGE, APPOINTMENT_GONE_MESSAGE } from '../constants/messages'
import type { RescheduleInput } from '../types/appointment'

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
        toast.error(APPOINTMENT_GONE_MESSAGE)
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
      toast.error(ACTION_ERROR_MESSAGE)
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
