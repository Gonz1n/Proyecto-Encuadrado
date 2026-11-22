import { CalendarRange, Columns3, List, type LucideIcon } from 'lucide-react'
import type { View } from '../types/calendar'

export const AGENDA_RANGES = [
  { days: 7, label: 'Próximos 7 días' },
  { days: 30, label: 'Próximos 30 días' },
] as const

export const AGENDA_VIEWS: { value: View; label: string; icon: LucideIcon }[] = [
  { value: 'lista', label: 'Lista', icon: List },
  { value: 'semana', label: 'Semana', icon: CalendarRange },
  { value: 'dia', label: 'Día', icon: Columns3 },
]

export const ALL_PROFESSIONALS = 'all'
