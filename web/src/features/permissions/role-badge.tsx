import { Eye, ShieldCheck, Stethoscope, type LucideIcon } from 'lucide-react'
import { badgeVariants } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { ROLE_HINTS, ROLE_LABELS, type Role } from './roles'

const ROLE_STYLES: Record<Role, { icon: LucideIcon; className: string }> = {
  admin: { icon: ShieldCheck, className: 'bg-primary text-primary-foreground' },
  member: { icon: Stethoscope, className: 'bg-primary/10 text-primary' },
  viewer: { icon: Eye, className: 'border-border bg-muted text-muted-foreground' },
}

export function RoleBadge({ role }: { role: Role }) {
  const { icon: Icon, className } = ROLE_STYLES[role]
  return (
    <Tooltip>
      <TooltipTrigger className={cn(badgeVariants(), 'h-6 cursor-default px-2.5 outline-none', className)}>
        <Icon aria-hidden="true" />
        {ROLE_LABELS[role]}
      </TooltipTrigger>
      <TooltipContent side="bottom">{ROLE_HINTS[role]}</TooltipContent>
    </Tooltip>
  )
}
