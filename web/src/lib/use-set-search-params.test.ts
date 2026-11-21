import { beforeEach, expect, test, vi } from 'vitest'

const router = { push: vi.fn(), replace: vi.fn() }

vi.mock('next/navigation', () => ({
  useRouter: () => router,
  usePathname: () => '/app/centro/agenda',
  useSearchParams: () => new URLSearchParams('view=week&professional=3'),
}))

import { useSetSearchParams } from './use-set-search-params'

beforeEach(() => {
  router.push.mockClear()
  router.replace.mockClear()
})

test('useSetSearchParams keeps other params and replaces', () => {
  const setSearchParams = useSetSearchParams()
  setSearchParams(
    (prev) => {
      prev.set('view', 'day')
      return prev
    },
    { replace: true },
  )
  expect(router.replace).toHaveBeenCalledWith('/app/centro/agenda?view=day&professional=3', {
    scroll: false,
  })
  expect(router.push).not.toHaveBeenCalled()
})

test('useSetSearchParams pushes by default and drops the query when empty', () => {
  const setSearchParams = useSetSearchParams()
  setSearchParams(() => new URLSearchParams())
  expect(router.push).toHaveBeenCalledWith('/app/centro/agenda', { scroll: false })
  expect(router.replace).not.toHaveBeenCalled()
})
