import { expect, test } from 'vitest'
import { normalizeRut } from './rut'

test('normalizeRut valida el digito verificador y da formato', () => {
  expect(normalizeRut('123456785')).toBe('12.345.678-5')
  expect(normalizeRut(' 12.345.678-5 ')).toBe('12.345.678-5')
  expect(normalizeRut('10.000.013-k')).toBe('10.000.013-K')
  expect(normalizeRut('12.345.678-9')).toBeNull()
  expect(normalizeRut('abc')).toBeNull()
})
