import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE, sessionCookieOptions } from '@/lib/session'

type Context = { params: Promise<{ path: string[] }> }

async function proxy(request: NextRequest, { params }: Context): Promise<Response> {
  const { path } = await params
  const route = path.join('/')
  const url = `${process.env.API_URL}/api/${route}/${request.nextUrl.search}`

  const headers: Record<string, string> = {}
  const contentType = request.headers.get('content-type')
  if (contentType) headers['content-type'] = contentType
  const token = request.cookies.get(SESSION_COOKIE)?.value
  if (token) headers.authorization = `Bearer ${token}`

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD'
  const body = hasBody ? await request.arrayBuffer() : undefined

  let upstream: Response
  try {
    upstream = await fetch(url, { method: request.method, headers, body })
  } catch {
    const failed = NextResponse.json({ detail: 'Servicio no disponible' }, { status: 502 })
    if (route === 'auth/logout') failed.cookies.delete(SESSION_COOKIE)
    return failed
  }

  if (upstream.status === 204) {
    const empty = new NextResponse(null, { status: 204 })
    if (route === 'auth/logout') empty.cookies.delete(SESSION_COOKIE)
    return empty
  }

  if (route === 'auth/login' && upstream.status === 200) {
    const body = await upstream.json()
    const res = NextResponse.json({ user: body.user })
    res.cookies.set(SESSION_COOKIE, body.token, sessionCookieOptions)
    return res
  }

  const res = new NextResponse(upstream.body, {
    status: upstream.status,
    headers: { 'content-type': upstream.headers.get('content-type') ?? 'application/json' },
  })
  if (route === 'auth/logout' || upstream.status === 401) res.cookies.delete(SESSION_COOKIE)
  return res
}

export { proxy as GET, proxy as POST, proxy as PATCH, proxy as PUT, proxy as DELETE }
