import { ALLOWED_ROLES } from '../constants/roles'
import type { Action, Role } from '../types/permissions'

type Member = { id: number; role: Role }

type OwnedAppointment = { professional: { id: number } }

export function can(role: Role, action: Action): boolean {
  return ALLOWED_ROLES[action].includes(role)
}

export function canManageAppointment(member: Member, appointment: OwnedAppointment): boolean {
  if (member.role === 'admin') return true
  return member.role === 'member' && appointment.professional.id === member.id
}
