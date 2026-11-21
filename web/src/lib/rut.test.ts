import { expect, test } from 'vitest'
import { formatRutInput, normalizeRut } from './rut'

test('normalizeRut valida el digito verificador y da formato', () => {
  expect(normalizeRut('123456785')).toBe('12.345.678-5')
  expect(normalizeRut(' 12.345.678-5 ')).toBe('12.345.678-5')
  expect(normalizeRut('10.000.013-k')).toBe('10.000.013-K')
  expect(normalizeRut('12.345.678-9')).toBeNull()
  expect(normalizeRut('abc')).toBeNull()
})

test('normalizeRut exige al menos 7 digitos en el cuerpo', () => {
  expect(normalizeRut('1-9')).toBeNull()
  expect(normalizeRut('999.999-K')).toBeNull()
  expect(normalizeRut('1.000.000-9')).toBe('1.000.000-9')
})

test('formatRutInput da formato mientras se escribe', () => {
  expect(formatRutInput('')).toBe('')
  expect(formatRutInput('1')).toBe('1')
  expect(formatRutInput('12')).toBe('1-2')
  expect(formatRutInput('1234')).toBe('123-4')
  expect(formatRutInput('123456785')).toBe('12.345.678-5')
  expect(formatRutInput('12.345.678-5')).toBe('12.345.678-5')
  expect(formatRutInput('10000013k')).toBe('10.000.013-K')
  expect(formatRutInput('12a3b4')).toBe('123-4')
  expect(formatRutInput('1234567891234')).toBe('12.345.678-9')
  expect(formatRutInput('k12')).toBe('1-2')
})
