import { NextRequest } from 'next/server'
import { expect, test } from 'vitest'
import { config, proxy } from './proxy'

function req(url: string, session?: string) {
  return new NextRequest(`http://localhost${url}`, session ? { headers: { cookie: `session=${session}` } } : {})
}

test('matcher covers guarded routes', () => {
  expect(config.matcher).toEqual(['/', '/app/:path*', '/login'])
})

test('redirects anonymous user to login with next', () => {
  const res = proxy(req('/app/agenda?d=1'))
  expect(res.status).toBe(307)
  expect(new URL(res.headers.get('location')!).pathname + new URL(res.headers.get('location')!).search).toBe(
    '/login?next=%2Fapp%2Fagenda%3Fd%3D1',
  )
})

test('redirects anonymous user from root', () => {
  expect(new URL(proxy(req('/')).headers.get('location')!).pathname).toBe('/login')
})

test('lets anonymous user see login', () => {
  expect(proxy(req('/login')).headers.get('location')).toBeNull()
})

test('redirects authenticated user from login to next', () => {
  const res = proxy(req('/login?next=/app/x', 'tok'))
  expect(new URL(res.headers.get('location')!).pathname).toBe('/app/x')
})

test('middleware ignores unsafe next', () => {
  const res = proxy(req('/login?next=//evil.com', 'tok'))
  const location = new URL(res.headers.get('location')!)
  expect(location.host).toBe('localhost')
  expect(location.pathname).toBe('/')
})

test('ignores tab-smuggled next', () => {
  const res = proxy(req('/login?next=/%09/evil.com', 'tok'))
  const location = new URL(res.headers.get('location')!)
  expect(location.host).toBe('localhost')
  expect(location.pathname).toBe('/')
})

test('lets authenticated user through app routes', () => {
  expect(proxy(req('/app/x', 'tok')).headers.get('location')).toBeNull()
})
