import { expect, test } from 'vitest'
import { centerPhoto, photoFor } from './center-photos'

test('returns the mapped path or null', () => {
  const photos = { aurora: '/centros/aurora.jpg' }
  expect(photoFor(photos, 'aurora')).toBe('/centros/aurora.jpg')
  expect(photoFor(photos, 'otro')).toBeNull()
  expect(photoFor(photos, 'toString')).toBeNull()
})

test('unknown slug has no photo', () => {
  expect(centerPhoto('no-existe')).toBeNull()
})
