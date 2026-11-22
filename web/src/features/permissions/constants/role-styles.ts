import { Eye, ShieldCheck, Stethoscope, type LucideIcon } from 'lucide-react'
import type { Role } from '../types/permissions'

export const ROLE_STYLES: Record<Role, { icon: LucideIcon; className: string }> = {
  admin: { icon: ShieldCheck, className: 'bg-primary text-primary-foreground' },
  member: { icon: Stethoscope, className: 'bg-primary/10 text-primary' },
  viewer: { icon: Eye, className: 'border-border bg-muted text-muted-foreground' },
}
