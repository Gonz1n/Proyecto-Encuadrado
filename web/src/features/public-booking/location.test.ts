import { expect, test } from 'vitest'
import { mapsDirectionsUrl, mapsEmbedUrl, mapsQuery, telHref } from './location'

test('builds the query with commune and country', () => {
  expect(mapsQuery('Av. Providencia 1234', 'Providencia')).toBe('Av. Providencia 1234, Providencia, Chile')
  expect(mapsQuery(' Av. Providencia 1234 ', '')).toBe('Av. Providencia 1234, Chile')
  expect(mapsQuery('', 'Providencia')).toBe('')
})

test('encodes the map urls', () => {
  const query = encodeURIComponent('Av. Ñuñoa 10 & 20, Ñuñoa, Chile')
  expect(mapsEmbedUrl('Av. Ñuñoa 10 & 20', 'Ñuñoa')).toBe(`https://www.google.com/maps?q=${query}&output=embed`)
  expect(mapsDirectionsUrl('Av. Ñuñoa 10 & 20', 'Ñuñoa')).toBe(`https://www.google.com/maps/search/?api=1&query=${query}`)
})

test('returns empty urls without address', () => {
  expect(mapsEmbedUrl('', 'Ñuñoa')).toBe('')
  expect(mapsDirectionsUrl('  ', '')).toBe('')
})

test('keeps only plus and digits in tel href', () => {
  expect(telHref('+56 2 2345-6789')).toBe('tel:+56223456789')
  expect(telHref('(02) 2345 6789')).toBe('tel:0223456789')
  expect(telHref('')).toBe('')
})
