import { expect, test } from 'vitest'
import type { Appointment } from '@/features/appointments/api'
import type { Membership } from '@/features/auth/api'
import { canManageAppointment } from './roles'

const membership = (role: Membership['role'], id = 1): Membership => ({
  id,
  role,
  role_label: role,
  center: { slug: 'centro', name: 'Centro' },
})
const appointment = { professional: { id: 1, full_name: 'Matías' } } as Appointment

test('admin manages any appointment', () => {
  expect(canManageAppointment(membership('admin', 9), appointment)).toBe(true)
})

test('member manages only their own appointments', () => {
  expect(canManageAppointment(membership('member', 1), appointment)).toBe(true)
  expect(canManageAppointment(membership('member', 2), appointment)).toBe(false)
})

test('viewer never manages', () => {
  expect(canManageAppointment(membership('viewer', 1), appointment)).toBe(false)
})
