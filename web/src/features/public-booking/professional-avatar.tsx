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
}: {
  professional: PublicProfessional
  className?: string
}) {
  return (
    <Avatar className={cn('size-12', className)}>
      {professional.avatar_url ? <AvatarImage src={professional.avatar_url} alt="" /> : null}
      <AvatarFallback className="bg-primary/10 font-medium text-primary">
        {initials(professional.full_name)}
      </AvatarFallback>
    </Avatar>
  )
}
