import { NextRequest } from 'next/server'
import { expect, test } from 'vitest'
import { config, proxy } from './proxy'

function req(url: string, session?: string) {
  return new NextRequest(`http://localhost${url}`, session ? { headers: { cookie: `session=${session}` } } : {})
}

const location = (res: Response) => new URL(res.headers.get('location')!)

test('matcher covers guarded routes', () => {
  expect(config.matcher).toEqual(['/', '/app/:path*', '/login'])
})

test('redirects anonymous user to login with next', () => {
  const res = proxy(req('/app/agenda?d=1'))
  expect(res.status).toBe(307)
  expect(location(res).pathname + location(res).search).toBe('/login?next=%2Fapp%2Fagenda%3Fd%3D1')
})

test('redirects anonymous user from root', () => {
  expect(location(proxy(req('/'))).pathname).toBe('/login')
})

test('lets anonymous user see login', () => {
  expect(proxy(req('/login')).headers.get('location')).toBeNull()
})

test('redirects authenticated user from login to next', () => {
  expect(location(proxy(req('/login?next=/app/x', 'tok'))).pathname).toBe('/app/x')
})

test.each([
  ['ignores unsafe next', '//evil.com'],
  ['ignores tab-smuggled next', '/%09/evil.com'],
])('%s', (_, next) => {
  const url = location(proxy(req(`/login?next=${next}`, 'tok')))
  expect(url.host).toBe('localhost')
  expect(url.pathname).toBe('/')
})

test('lets authenticated user through app routes', () => {
  expect(proxy(req('/app/x', 'tok')).headers.get('location')).toBeNull()
})
