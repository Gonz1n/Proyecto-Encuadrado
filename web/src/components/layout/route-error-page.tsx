'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { NotFoundPage } from './not-found-page'

export function RouteErrorPage() {
  return (
    <NotFoundPage
      title="Algo salió mal"
      description="No pudimos mostrar esta página. Intenta de nuevo en unos minutos."
    />
  )
}

export function PublicRouteErrorPage() {
  const { slug } = useParams<{ slug: string }>()
  return (
    <NotFoundPage
      title="Algo salió mal"
      description="No pudimos mostrar esta página. Intenta de nuevo en unos minutos."
      action={
        <Button nativeButton={false} render={<Link href={`/c/${slug}`} />}>
          Volver al perfil del centro
        </Button>
      }
    />
  )
}
