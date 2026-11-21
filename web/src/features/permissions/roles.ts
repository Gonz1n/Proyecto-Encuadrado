import type { Membership } from '@/features/auth/api'
import type { Appointment } from '@/features/appointments/api'

export type Role = 'admin' | 'member' | 'viewer'

export type Action = 'center:edit' | 'agenda:view-all'

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrador',
  member: 'Profesional',
  viewer: 'Solo lectura',
}

export const ROLE_HINTS: Record<Role, string> = {
  admin: 'Puedes editar el centro y gestionar toda la agenda',
  member: 'Puedes ver y gestionar tus propios agendamientos',
  viewer: 'Puedes ver la información, sin hacer cambios',
}

const ALLOWED_ROLES: Record<Action, readonly Role[]> = {
  'center:edit': ['admin'],
  'agenda:view-all': ['admin', 'viewer'],
}

export function can(role: Role, action: Action): boolean {
  return ALLOWED_ROLES[action].includes(role)
}

export function canManageAppointment(membership: Membership, appointment: Appointment): boolean {
  if (membership.role === 'admin') return true
  return membership.role === 'member' && appointment.professional.id === membership.id
}
