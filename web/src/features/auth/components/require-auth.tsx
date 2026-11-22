'use client'

import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { NotFoundPage } from '@/components/layout/not-found-page'
import { useAuth } from '../contexts/auth-context'
import { isUnauthorized } from '@/utils/api-errors'
import { useMeQuery } from '../hooks/use-me-query'

function SessionLoading() {
  return (
    <div className="flex min-h-svh items-center justify-center" role="status">
      <Loader2 className="size-5 text-muted-foreground motion-safe:animate-spin" aria-hidden="true" />
      <span className="sr-only">Cargando tu sesión</span>
    </div>
  )
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const me = useMeQuery()

  if (me.isError && !isUnauthorized(me.error) && !user) {
    return (
      <NotFoundPage
        title="No pudimos cargar tu sesión"
        description="Revisa tu conexión e intenta de nuevo."
        action={<Button onClick={() => me.refetch()}>Reintentar</Button>}
      />
    )
  }
  if (!user) return <SessionLoading />
  return children
}

export function RedirectToFirstCenter() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const first = user?.memberships[0]
  const slug = first?.center.slug

  useEffect(() => {
    if (slug) router.replace(`/app/${slug}/agenda`)
  }, [slug, router])

  if (!first) {
    return (
      <NotFoundPage
        title="Aún no perteneces a ningún centro"
        description="Pide a la administración de tu centro que te agregue al equipo."
        action={
          <Button variant="outline" onClick={logout}>
            Cerrar sesión
          </Button>
        }
      />
    )
  }
  return <SessionLoading />
}
