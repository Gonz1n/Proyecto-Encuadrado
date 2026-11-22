'use client'

import { useParams } from 'next/navigation'
import { NotFoundPage } from '@/components/layout/not-found-page'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { usePublicCenter } from '@/features/center/hooks/use-public-center'
import { isNotFound } from '@/utils/api-errors'
import { CenterProfile } from './center-profile'

export function CenterProfilePage() {
  const { slug } = useParams<{ slug: string }>()
  const center = usePublicCenter(slug)

  if (center.isPending) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-12 sm:px-6">
        <Skeleton className="size-12 rounded-xl" />
        <Skeleton className="h-10 w-72 max-w-full" />
        <Skeleton className="h-5 w-full max-w-xl" />
        <Skeleton className="h-11 w-44" />
      </div>
    )
  }
  if (center.isError) {
    const missing = isNotFound(center.error)
    return (
      <NotFoundPage
        title={missing ? 'No encontramos este centro' : 'No pudimos cargar el centro'}
        description={missing ? 'Revisa la dirección que te compartieron.' : 'Revisa tu conexión e intenta de nuevo.'}
        action={missing ? null : <Button onClick={() => center.refetch()}>Reintentar</Button>}
      />
    )
  }

  return <CenterProfile center={center.data} />
}
