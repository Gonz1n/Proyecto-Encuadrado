import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'

export function firstMessage(data: Record<string, unknown>, key: string): string | null {
  const messages = data[key]
  return Array.isArray(messages) && messages.length > 0 ? String(messages[0]) : null
}

export function setFieldErrors<T extends FieldValues>(
  data: Record<string, unknown>,
  fields: readonly Path<T>[],
  setError: UseFormSetError<T>,
): boolean {
  let mapped = false
  for (const field of fields) {
    const message = firstMessage(data, field)
    if (message) {
      setError(field, { message })
      mapped = true
    }
  }
  return mapped
}
