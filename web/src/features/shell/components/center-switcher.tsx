'use client'

import { ChevronsUpDown } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Membership } from '@/features/auth/types/auth'

type CenterSwitcherProps = {
  memberships: Membership[]
  current: Membership
}

export function CenterSwitcher({ memberships, current }: CenterSwitcherProps) {
  const router = useRouter()
  const pathname = usePathname()
  const section = pathname.split('/')[3] ?? 'agenda'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            className="h-9 max-w-full min-w-0 gap-2 px-2 text-base font-bold text-primary"
            aria-label={`Centro actual: ${current.center.name}. Cambiar de centro`}
          />
        }
      >
        <span className="truncate">{current.center.name}</span>
        <ChevronsUpDown className="text-muted-foreground" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Tus centros</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={current.center.slug}
            onValueChange={(slug: string) => router.push(`/app/${slug}/${section}`)}
          >
            {memberships.map((membership) => (
              <DropdownMenuRadioItem key={membership.id} value={membership.center.slug} className="flex-col items-start gap-0 py-1.5">
                <span>{membership.center.name}</span>
                <span className="text-xs text-muted-foreground">{membership.role_label}</span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
