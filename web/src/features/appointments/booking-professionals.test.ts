import { expect, test } from 'vitest'
import type { Membership } from '@/features/auth/api'
import { selectableProfessionals } from './booking-professionals'

const membership = (role: Membership['role'], id: number): Membership => ({
  id,
  role,
  role_label: role,
  center: { slug: 'centro', name: 'Centro' },
})
const professionals = [{ id: 1 }, { id: 2 }, { id: 3 }]

test('admin picks any professional', () => {
  expect(selectableProfessionals(membership('admin', 9), professionals)).toEqual(professionals)
})

test('member can only pick themselves', () => {
  expect(selectableProfessionals(membership('member', 2), professionals)).toEqual([{ id: 2 }])
})

test('viewer picks nobody', () => {
  expect(selectableProfessionals(membership('viewer', 1), professionals)).toEqual([])
})
