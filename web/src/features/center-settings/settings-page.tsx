'use client'

import { ExternalLink } from 'lucide-react'
import { useParams } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import { useCan } from '@/features/permissions/use-can'
import { CenterForm } from './center-form'
import { ClosuresCard } from './closures-card'
import { useCenter } from './hooks'
import { ServicesTable } from './services-table'

export function SettingsPage() {
  const { slug } = useParams<{ slug: string }>()
  const canEdit = useCan('center:edit')
  const { data: center, isPending, isError } = useCenter(slug)

  return (
    <div className="space-y-12">
      <title>Configuración | CentradaMente</title>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Configuración</h1>
        <a
          href={`/c/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Ver perfil público
          <ExternalLink className="size-4" aria-hidden="true" />
        </a>
      </div>
      <section aria-labelledby="center-heading" className="max-w-2xl space-y-5">
        <div className="space-y-1">
          <h2 id="center-heading" className="text-lg font-semibold tracking-tight">
            Datos del centro
          </h2>
          <p className="text-sm text-muted-foreground">
            Lo que ven tus pacientes en la página pública de agendamiento.
          </p>
        </div>
        {isPending ? (
          <Skeleton className="h-72 w-full" />
        ) : isError ? (
          <p role="alert" className="text-sm text-destructive">
            No pudimos cargar la configuración. Intenta de nuevo.
          </p>
        ) : (
          <CenterForm key={slug} slug={slug} center={center} canEdit={canEdit} />
        )}
      </section>
      <section aria-labelledby="services-heading" className="max-w-3xl space-y-5">
        <div className="space-y-1">
          <h2 id="services-heading" className="text-lg font-semibold tracking-tight">
            Servicios
          </h2>
          <p className="text-sm text-muted-foreground">
            Precio y duración de lo que se puede agendar.
          </p>
        </div>
        <ServicesTable slug={slug} canEdit={canEdit} />
      </section>
      <section aria-labelledby="closures-heading" className="max-w-3xl space-y-5">
        <div className="space-y-1">
          <h2 id="closures-heading" className="text-lg font-semibold tracking-tight">
            Días sin atención
          </h2>
          <p className="text-sm text-muted-foreground">
            Feriados o cierres puntuales. Las citas de ese día se cancelan.
          </p>
        </div>
        <ClosuresCard slug={slug} canEdit={canEdit} />
      </section>
    </div>
  )
}
