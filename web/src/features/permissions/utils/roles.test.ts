import { expect, test } from 'vitest'
import type { Role } from '../types/permissions'
import { can, canManageAppointment } from './roles'

const member = (role: Role, id: number) => ({ id, role })
const appointment = { professional: { id: 1 } }

test.each([
  ['admin manages any appointment', member('admin', 9), true],
  ['member manages their own appointments', member('member', 1), true],
  ['member does not manage other appointments', member('member', 2), false],
  ['viewer never manages', member('viewer', 1), false],
])('%s', (_, current, expected) => {
  expect(canManageAppointment(current, appointment)).toBe(expected)
})

test.each([
  ['admin', true],
  ['member', true],
  ['viewer', false],
] as const)('%s can create appointments: %s', (role, expected) => {
  expect(can(role, 'agenda:create')).toBe(expected)
})
