import { expect, test } from 'vitest'
import { cancelledMessage } from './cancelled-message'

test('cancelledMessage agrega la cantidad de citas canceladas', () => {
  expect(cancelledMessage('Colación guardada.', 0)).toBe('Colación guardada.')
  expect(cancelledMessage('Colación guardada.', 1)).toBe('Colación guardada. Se canceló 1 cita.')
  expect(cancelledMessage('Colación guardada.', 3)).toBe('Colación guardada. Se cancelaron 3 citas.')
})
