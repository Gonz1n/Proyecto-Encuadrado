import { expect, test } from 'vitest'
import { formatOpenDays } from './format'

test('formatOpenDays describe los días de atención', () => {
  expect(formatOpenDays([0, 1, 2, 3, 4, 5, 6])).toBe('todos los días')
  expect(formatOpenDays([0, 1, 2, 3, 4])).toBe('de lunes a viernes')
  expect(formatOpenDays([0, 2, 4])).toBe('los lunes, miércoles y viernes')
  expect(formatOpenDays([5])).toBe('los sábados')
  expect(formatOpenDays([4, 5, 6])).toBe('de viernes a domingo')
})
