import { expect, test } from 'vitest'
import type { Appointment } from '@/features/appointments/api'
import type { Membership } from '@/features/auth/api'
import { canManageAppointment } from './roles'

const membership = (role: Membership['role'], id: number): Membership => ({ id, role, role_label: role, center: { slug: 'centro', name: 'Centro' } })
const appointment = { professional: { id: 1, full_name: 'Matías' } } as Appointment

test.each([
  ['admin manages any appointment', membership('admin', 9), true],
  ['member manages their own appointments', membership('member', 1), true],
  ['member does not manage other appointments', membership('member', 2), false],
  ['viewer never manages', membership('viewer', 1), false],
])('%s', (_, member, expected) => {
  expect(canManageAppointment(member, appointment)).toBe(expected)
})
