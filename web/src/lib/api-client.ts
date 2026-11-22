export class ApiError extends Error {
  status: number
  data: unknown

  constructor(status: number, data: unknown) {
    super(`Error de API ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

interface ApiFetchInit {
  method?: string
  body?: unknown
}

export async function apiFetch<T>(path: string, { method = 'GET', body }: ApiFetchInit = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const response = await fetch(path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
  if (response.status === 204) return undefined as T

  const data: unknown = await response.json().catch(() => null)
  if (!response.ok) throw new ApiError(response.status, data)
  return data as T
}
