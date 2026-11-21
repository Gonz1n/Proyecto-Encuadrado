export const SESSION_COOKIE = 'session'

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 60 * 60 * 24 * 30,
} as const

export function hasSession(cookies: { has(name: string): boolean }): boolean {
  return cookies.has(SESSION_COOKIE)
}
