import { SESSION_COOKIE } from '@/constants/session'

export function hasSession(cookies: { has(name: string): boolean }): boolean {
  return cookies.has(SESSION_COOKIE)
}
