import type { Action, Role } from '../types/permissions'

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

export const ALLOWED_ROLES: Record<Action, readonly Role[]> = {
  'center:edit': ['admin'],
  'agenda:view-all': ['admin', 'viewer'],
  'agenda:create': ['admin', 'member'],
}
