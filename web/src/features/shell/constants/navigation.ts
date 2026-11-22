import { CalendarDays, Settings, UserRound, type LucideIcon } from 'lucide-react'

export const NAV_ITEMS: { section: string; label: string; icon: LucideIcon }[] = [
  { section: 'agenda', label: 'Agenda', icon: CalendarDays },
  { section: 'configuracion', label: 'Configuración', icon: Settings },
  { section: 'perfil', label: 'Mi perfil', icon: UserRound },
]
