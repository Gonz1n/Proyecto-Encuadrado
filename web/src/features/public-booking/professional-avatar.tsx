import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import type { PublicProfessional } from './api'

function initials(fullName: string): string {
  const words = fullName.split(/\s+/).filter(Boolean)
  return `${words[0]?.charAt(0) ?? ''}${words.length > 1 ? words.at(-1)!.charAt(0) : ''}`.toUpperCase()
}

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
      {professional.avatar_url ? <AvatarImage src={professional.avatar_url} alt="" /> : null}
      <AvatarFallback className={cn('bg-[var(--cp-salmon,var(--primary))]/60 font-medium text-[var(--cp-granate,var(--primary))]', fallbackClassName)}>
        {initials(professional.full_name)}
      </AvatarFallback>
    </Avatar>
  )
}
