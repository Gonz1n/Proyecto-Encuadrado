import { expect, test } from 'vitest'
import type { Membership } from '@/features/auth/api'
import { selectableProfessionals } from './booking-professionals'

const membership = (role: Membership['role'], id: number): Membership => ({ id, role, role_label: role, center: { slug: 'centro', name: 'Centro' } })
const professionals = [{ id: 1 }, { id: 2 }, { id: 3 }]

test.each([
  ['admin picks any professional', membership('admin', 9), professionals],
  ['member can only pick themselves', membership('member', 2), [{ id: 2 }]],
  ['viewer picks nobody', membership('viewer', 1), []],
])('%s', (_, member, expected) => {
  expect(selectableProfessionals(member, professionals)).toEqual(expected)
})
