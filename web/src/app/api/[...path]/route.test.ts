import { NextRequest } from 'next/server'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { DELETE, GET, PATCH, POST, PUT } from './route'

const USER = { id: 1, email: 'a@b.cl' }
const fetchMock = vi.fn()

function ctx(path: string[]) {
  return { params: Promise.resolve({ path }) }
}

function req(url: string, init: { method?: string; body?: string; cookie?: string } = {}) {
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (init.cookie) headers.cookie = `session=${init.cookie}`
  return new NextRequest(`http://localhost${url}`, { method: init.method, body: init.body, headers })
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

beforeEach(() => {
  process.env.API_URL = 'http://api.test'
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

test('exports all methods', () => {
  for (const handler of [GET, POST, PATCH, PUT, DELETE]) expect(typeof handler).toBe('function')
})

test('forwards bearer token from cookie', async () => {
  fetchMock.mockResolvedValue(json(USER))
  const res = await GET(req('/api/auth/me', { cookie: 'abc' }), ctx(['auth', 'me']))
  expect(res.status).toBe(200)
  expect(fetchMock).toHaveBeenCalledWith(
    'http://api.test/api/auth/me/',
    expect.objectContaining({ headers: expect.objectContaining({ authorization: 'Bearer abc' }) }),
  )
})

test('keeps trailing slash and query string', async () => {
  fetchMock.mockResolvedValue(json([]))
  await GET(req('/api/appointments?from=2026-01-01&x=1'), ctx(['appointments']))
  expect(fetchMock.mock.calls[0][0]).toBe('http://api.test/api/appointments/?from=2026-01-01&x=1')
})

test('forwards method, body and content type', async () => {
  fetchMock.mockResolvedValue(json({ ok: true }, 201))
  const res = await POST(req('/api/appointments', { method: 'POST', body: '{"a":1}' }), ctx(['appointments']))
  expect(res.status).toBe(201)
  const init = fetchMock.mock.calls[0][1]
  expect(init.method).toBe('POST')
  expect(init.headers['content-type']).toBe('application/json')
  expect(await new Response(init.body).text()).toBe('{"a":1}')
})

test('login strips token and sets httpOnly cookie', async () => {
  fetchMock.mockResolvedValue(json({ token: 'tok', user: USER, extra: 1 }))
  const res = await POST(req('/api/auth/login', { method: 'POST', body: '{}' }), ctx(['auth', 'login']))
  expect(await res.json()).toEqual({ user: USER })
  expect(res.headers.get('set-cookie')).toMatch(/session=tok.*HttpOnly/i)
})

test('failed login does not set cookie', async () => {
  fetchMock.mockResolvedValue(json({ detail: 'bad' }, 400))
  const res = await POST(req('/api/auth/login', { method: 'POST', body: '{}' }), ctx(['auth', 'login']))
  expect(res.status).toBe(400)
  expect(res.headers.get('set-cookie')).toBeNull()
})

test('logout clears cookie even if api fails', async () => {
  fetchMock.mockRejectedValue(new Error('down'))
  const res = await POST(req('/api/auth/logout', { method: 'POST', cookie: 'abc' }), ctx(['auth', 'logout']))
  expect(res.headers.get('set-cookie')).toMatch(/session=;/)
})

test('logout returns api status', async () => {
  fetchMock.mockResolvedValue(new Response(null, { status: 204 }))
  const res = await POST(req('/api/auth/logout', { method: 'POST', cookie: 'abc' }), ctx(['auth', 'logout']))
  expect(res.status).toBe(204)
  expect(res.headers.get('set-cookie')).toMatch(/session=;/)
})

test('proxy clears session cookie on upstream 401', async () => {
  fetchMock.mockResolvedValue(json({ detail: 'no' }, 401))
  const res = await GET(req('/api/auth/me', { cookie: 'abc' }), ctx(['auth', 'me']))
  expect(res.status).toBe(401)
  expect(res.headers.get('set-cookie')).toMatch(/session=;/)
})

test('204 has no body', async () => {
  fetchMock.mockResolvedValue(new Response(null, { status: 204 }))
  const res = await DELETE(req('/api/appointments/1', { method: 'DELETE' }), ctx(['appointments', '1']))
  expect(res.status).toBe(204)
  expect(await res.text()).toBe('')
})
