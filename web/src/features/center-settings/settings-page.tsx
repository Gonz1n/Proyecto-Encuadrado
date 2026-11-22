'use client'

import { ExternalLink } from 'lucide-react'
import { useParams } from 'next/navigation'
import type { ReactNode } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { useCan } from '@/features/permissions/hooks/use-can'
import { CenterForm } from './center-form'
import { ClosuresCard } from './closures-card'
import { useCenter } from './hooks'
import { ServicesTable } from './services-table'

type SectionProps = { id: string; title: string; description: string; className?: string; children: ReactNode }

function Section({ id, title, description, className = 'max-w-3xl', children }: SectionProps) {
  return (
    <section aria-labelledby={`${id}-heading`} className={`${className} space-y-5`}>
      <div className="space-y-1">
        <h2 id={`${id}-heading`} className="text-lg font-bold tracking-tight text-primary">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  )
}

export function SettingsPage() {
  const { slug } = useParams<{ slug: string }>()
  const canEdit = useCan('center:edit')
  const { data: center, isPending, isError } = useCenter(slug)

  return (
    <div className="space-y-12">
      <title>Configuración | CentradaMente</title>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-primary border-b-2 border-primary pb-1.5">Configuración</h1>
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
      <Section id="center" title="Datos del centro" description="Lo que ven tus pacientes en la página pública de agendamiento." className="max-w-2xl">
        {isPending ? (
          <Skeleton className="h-72 w-full" />
        ) : isError ? (
          <p role="alert" className="text-sm text-destructive">
            No pudimos cargar la configuración. Intenta de nuevo.
          </p>
        ) : (
          <CenterForm key={slug} slug={slug} center={center} canEdit={canEdit} />
        )}
      </Section>
      <Section id="services" title="Servicios" description="Precio y duración de lo que se puede agendar.">
        <ServicesTable slug={slug} canEdit={canEdit} />
      </Section>
      <Section id="closures" title="Días sin atención" description="Feriados o cierres puntuales. Las citas de ese día se cancelan.">
        <ClosuresCard slug={slug} canEdit={canEdit} />
      </Section>
    </div>
  )
}
