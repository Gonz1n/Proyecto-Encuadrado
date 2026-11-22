'use client'

import { Check, ChevronDown, LogIn } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { centersMenuItems, centersMenuState, shouldRefetchCenters } from '../utils/centers-menu'
import { usePublicCenters } from '@/features/center/hooks/use-public-center'
import { MENU_MOTION_CLASS } from '../constants/styles'

export function PublicHeader({ slug }: { slug: string }) {
  const centers = usePublicCenters()
  const items = centersMenuItems(centers.data ?? [], slug)
  const status = { isError: centers.isError, hasData: Boolean(centers.data?.length) }
  const state = centersMenuState(status)
  const handleOpenChange = (open: boolean) => {
    if (open && shouldRefetchCenters({ ...status, isFetching: centers.isFetching })) void centers.refetch()
  }

  return (
    <header className="border-b bg-[linear-gradient(90deg,var(--background),var(--cp-header,var(--background)))]">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          href={`/c/${slug}`}
          className="-ml-1 flex min-w-0 items-center gap-2.5 rounded-lg p-1 font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <img src="/logo-centradamente.svg" alt="" aria-hidden="true" className="h-8 w-auto shrink-0" />
          <span className="truncate">CentradaMente</span>
        </Link>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <DropdownMenu onOpenChange={handleOpenChange}>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  className="h-10 shrink-0 gap-1.5 px-3 transition-[transform,background-color,color] duration-150 ease-out active:scale-[0.97] motion-reduce:transition-none [@media(hover:hover)_and_(pointer:fine)]:hover:bg-muted"
                />
              }
            >
              Otros centros
              <ChevronDown aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={6} className={MENU_MOTION_CLASS}>
              {state === 'loading' ? (
                <DropdownMenuItem disabled className="min-h-11 px-2.5 py-2">Cargando centros…</DropdownMenuItem>
              ) : null}
              {state === 'error' ? (
                <>
                  <DropdownMenuItem disabled className="min-h-11 px-2.5 py-2">No pudimos cargar los centros</DropdownMenuItem>
                  <DropdownMenuItem closeOnClick={false} onClick={() => void centers.refetch()} className="min-h-11 px-2.5 py-2 font-medium">
                    Reintentar
                  </DropdownMenuItem>
                </>
              ) : null}
              {items.map((item) => (
                <DropdownMenuItem
                  key={item.slug}
                  render={<Link href={`/c/${item.slug}`} />}
                  aria-current={item.current ? 'page' : undefined}
                  className="min-h-11 gap-3 px-2.5 py-2"
                >
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-medium">{item.name}</span>
                    {item.description ? <span className="truncate text-xs text-muted-foreground">{item.description}</span> : null}
                  </span>
                  {item.current ? (
                    <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-primary">
                      <Check aria-hidden="true" />
                      Estás aquí
                    </span>
                  ) : null}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            nativeButton={false}
            render={<Link href="/login" />}
            aria-label="Acceso profesionales"
            className="h-10 gap-1.5 px-3 transition-transform duration-150 ease-out active:scale-[0.97] motion-reduce:transition-none"
          >
            <LogIn aria-hidden="true" />
            <span className="hidden sm:inline">Acceso profesionales</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
