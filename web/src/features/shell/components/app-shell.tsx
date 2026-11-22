'use client'

import { LogOut } from 'lucide-react'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/contexts/auth-context'
import { RoleBadge } from '@/features/permissions/components/role-badge'
import { useCurrentMembership } from '@/features/auth/hooks/use-current-membership'
import { cn } from '@/lib/utils'
import { initials } from '@/utils/initials'
import { NAV_ITEMS } from '../constants/navigation'
import { FOCUS_RING } from '../constants/styles'
import { CenterSwitcher } from './center-switcher'
import { NotFoundPage } from '@/components/layout/not-found-page'

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const membership = useCurrentMembership()
  const pathname = usePathname()
  const { slug } = useParams<{ slug: string }>()

  if (!user) return null
  if (!membership) {
    return (
      <NotFoundPage
        title="No tienes acceso a este centro"
        description="Tu cuenta no pertenece al equipo de este centro. Si crees que es un error, pide acceso a su administración."
        action={
          <Button nativeButton={false} render={<Link href="/" />}>
            Ir a mi centro
          </Button>
        }
      />
    )
  }

  return (
    <div className="min-h-svh bg-background">
      <title>{`${membership.center.name} | CentradaMente`}</title>
      <header className="sticky top-0 z-40 border-b border-border bg-gradient-to-r from-accent to-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 sm:gap-3 sm:px-6">
          <Link href="/" aria-label="CentradaMente, ir al inicio" className={cn('flex shrink-0 items-center rounded-lg', FOCUS_RING)}>
            <img src="/logo-centradamente.svg" alt="" aria-hidden="true" className="h-8 w-auto" />
          </Link>
          <div className="flex min-w-0 flex-1 items-center">
            {user.memberships.length > 1 ? (
              <CenterSwitcher memberships={user.memberships} current={membership} />
            ) : (
              <span className="truncate px-2 text-base font-bold text-primary">{membership.center.name}</span>
            )}
          </div>
          <RoleBadge role={membership.role} />
          <div className="hidden items-center gap-2.5 border-l pl-3 md:flex">
            <Avatar size="sm">
              <AvatarFallback>{initials(user.first_name, user.last_name)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-medium">{user.full_name}</span>
              {user.title ? <span className="text-xs text-muted-foreground">{user.title}</span> : null}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">Cerrar sesión</span>
          </Button>
        </div>
        <nav aria-label="Secciones del centro" className="mx-auto max-w-6xl px-4 sm:px-6">
          <ul className="-mb-px flex gap-5">
            {NAV_ITEMS.map(({ section, label, icon: Icon }) => {
              const href = `/app/${slug}/${section}`
              const isActive = pathname.startsWith(href)
              return (
                <li key={section}>
                  <Link
                    href={href}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'inline-flex h-10 items-center gap-2 border-b-2 text-sm font-medium transition-colors',
                      FOCUS_RING,
                      isActive
                        ? 'border-primary font-semibold text-primary'
                        : 'border-transparent text-muted-foreground hover:border-secondary hover:text-primary',
                    )}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                    {label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  )
}
