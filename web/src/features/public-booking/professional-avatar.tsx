import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { nameInitials } from '@/utils/initials'
import type { PublicProfessional } from '@/features/center/types/public-center'

export function ProfessionalAvatar({
  professional,
  className,
  fallbackClassName,
}: {
  professional: PublicProfessional
  className?: string
  fallbackClassName?: string
}) {
  return (
    <Avatar className={cn('size-12', className)}>
      <AvatarFallback className={cn('bg-[var(--cp-salmon,var(--primary))]/60 font-medium text-[var(--cp-granate,var(--primary))]', fallbackClassName)}>
        {nameInitials(professional.full_name)}
      </AvatarFallback>
    </Avatar>
  )
}
