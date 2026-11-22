import { NextResponse, type NextRequest } from 'next/server'
import { safeNextPath } from '@/utils/safe-next-path'
import { hasSession } from '@/lib/session'

export function proxy(request: NextRequest) {
  const { pathname, search, searchParams } = request.nextUrl
  const authenticated = hasSession(request.cookies)

  if (pathname === '/login') {
    if (!authenticated) return NextResponse.next()
    return NextResponse.redirect(new URL(safeNextPath(searchParams.get('next')), request.url))
  }

  if (!authenticated) {
    const login = new URL('/login', request.url)
    login.searchParams.set('next', pathname + search)
    return NextResponse.redirect(login)
  }
  return NextResponse.next()
}

export const config = { matcher: ['/', '/app/:path*', '/login'] }
