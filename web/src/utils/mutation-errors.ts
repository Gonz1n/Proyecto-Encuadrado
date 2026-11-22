import { toast } from 'sonner'
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { FORBIDDEN_MESSAGE, SAVE_ERROR_MESSAGE } from '@/constants/messages'
import { isApiError, validationErrors } from './api-errors'
import { setFieldErrors } from './form-errors'

export function handleMutationError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
) {
  if (isApiError(error, 403)) {
    toast.error(FORBIDDEN_MESSAGE)
    return
  }
  const data = validationErrors(error)
  if (data && setFieldErrors(data, fields, setError)) return
  toast.error(SAVE_ERROR_MESSAGE)
}

export function notifyDeleteError(error: unknown, fallback: string) {
  toast.error(isApiError(error, 403) ? FORBIDDEN_MESSAGE : fallback)
}
