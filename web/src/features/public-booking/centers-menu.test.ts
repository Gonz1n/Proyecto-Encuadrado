import { expect, test } from 'vitest'
import { centersMenuItems, centersMenuState, shouldRefetchCenters } from './centers-menu'

const centers = [
  { slug: 'sur', name: 'Sur', description: 'Centro sur' },
  { slug: 'aurora', name: 'Aurora', description: '' },
  { slug: 'norte', name: 'norte', description: 'Centro norte' },
]

test('sorts by name ignoring case and flags the current center', () => {
  const items = centersMenuItems(centers, 'norte')
  expect(items.map((item) => item.slug)).toEqual(['aurora', 'norte', 'sur'])
  expect(items.map((item) => item.current)).toEqual([false, true, false])
})

test('does not mutate the input and flags none for an unknown slug', () => {
  const items = centersMenuItems(centers, 'otro')
  expect(centers[0].slug).toBe('sur')
  expect(items.some((item) => item.current)).toBe(false)
})

test('menu state prefers data, then error, then loading', () => {
  expect(centersMenuState({ isError: true, hasData: true })).toBe('items')
  expect(centersMenuState({ isError: true, hasData: false })).toBe('error')
  expect(centersMenuState({ isError: false, hasData: false })).toBe('loading')
})

test('refetches on open only when idle and without data or in error', () => {
  expect(shouldRefetchCenters({ isError: true, hasData: false, isFetching: false })).toBe(true)
  expect(shouldRefetchCenters({ isError: false, hasData: false, isFetching: false })).toBe(true)
  expect(shouldRefetchCenters({ isError: false, hasData: false, isFetching: true })).toBe(false)
  expect(shouldRefetchCenters({ isError: false, hasData: true, isFetching: false })).toBe(false)
})
