import { ApiError } from '@/lib/api-client'

export function isApiError(error: unknown, status: number): error is ApiError {
  return error instanceof ApiError && error.status === status
}

export function isUnauthorized(error: unknown): boolean {
  return isApiError(error, 401)
}

export function isNotFound(error: unknown): boolean {
  return isApiError(error, 404)
}

export function validationErrors(error: unknown): Record<string, unknown> | null {
  return isApiError(error, 400) && error.data ? (error.data as Record<string, unknown>) : null
}
