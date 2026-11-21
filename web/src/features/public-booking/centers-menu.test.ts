import { expect, test } from 'vitest'
import { centersMenuItems } from './centers-menu'

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
