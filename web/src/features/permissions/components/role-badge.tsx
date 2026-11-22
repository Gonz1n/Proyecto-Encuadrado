import { badgeVariants } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { ROLE_STYLES } from '../constants/role-styles'
import { ROLE_HINTS, ROLE_LABELS } from '../constants/roles'
import { type Role } from '../types/permissions'

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
