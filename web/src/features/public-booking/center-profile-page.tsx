'use client'

import { ChevronDown, Clock } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { NotFoundPage } from '@/components/layout/not-found-page'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCLP, formatDuration, formatOpenDays } from '@/lib/format'
import { SOCIAL_NETWORKS, socialHref } from '@/lib/social-links'
import type { PublicCenter } from './api'
import { isNotFound, usePublicCenter } from './hooks'
import { centerPhoto } from './center-photos'
import { PublicHeader } from './public-header'
import { ProfessionalAvatar } from './professional-avatar'
import { ProfessionalProfileDialog, ProfessionalSubtitle } from './professional-profile-dialog'

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
    return isNotFound(center.error) ? (
      <NotFoundPage
        title="No encontramos este centro"
        description="Revisa la dirección que te compartieron."
        action={null}
      />
    ) : (
      <NotFoundPage
        title="No pudimos cargar el centro"
        description="Revisa tu conexión e intenta de nuevo."
        action={<Button onClick={() => center.refetch()}>Reintentar</Button>}
      />
    )
  }

  return <CenterProfile center={center.data} />
}

function CenterProfile({ center }: { center: PublicCenter }) {
  const bookingPath = `/c/${center.slug}/agendar`
  const photo = centerPhoto(center.slug)
  return (
    <div className="min-h-svh bg-background">
      <title>{`${center.name} | Agenda en línea`}</title>
      <PublicHeader slug={center.slug} />
      <header className="border-b bg-accent/40">
        <div
          className={
            photo
              ? 'mx-auto grid max-w-5xl items-center gap-8 px-4 pt-10 pb-8 sm:px-6 sm:pt-16 sm:pb-12 md:grid-cols-2 md:gap-12'
              : 'mx-auto max-w-5xl px-4 pt-10 pb-8 sm:px-6 sm:pt-16 sm:pb-12'
          }
        >
          <div className="min-w-0">
            <span
              aria-hidden="true"
              className="flex size-12 items-center justify-center rounded-xl bg-primary text-lg font-semibold text-primary-foreground"
            >
              {center.name.charAt(0).toUpperCase()}
            </span>
            <h1 className="mt-6 text-3xl font-semibold tracking-tight text-balance [overflow-wrap:break-word] sm:text-4xl">
              {center.name}
            </h1>
            {center.description ? (
              <p className="mt-3 max-w-2xl text-base text-muted-foreground text-pretty sm:text-lg">
                {center.description}
              </p>
            ) : null}
            <p className="mt-4 flex items-center gap-2 text-sm">
              <Clock className="size-4 text-primary" aria-hidden="true" />
              Atiende {formatOpenDays(center.open_days)}, de {center.opening_time} a {center.closing_time} h
            </p>
            <SocialLinksList center={center} />
            <Button
              size="lg"
              className="mt-8 h-11 w-full px-5 text-base sm:w-auto"
              nativeButton={false}
              render={<Link href={bookingPath} />}
            >
              Agendar una hora
            </Button>
          </div>
          {photo ? (
            <img
              src={photo}
              alt={`Logo de ${center.name}`}
              className="aspect-[4/3] w-full rounded-2xl border bg-card object-contain p-8"
            />
          ) : null}
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-12 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-2 lg:gap-16">
        <section aria-labelledby="services-heading" className="space-y-4">
          <h2 id="services-heading" className="text-xl font-semibold tracking-tight">
            Servicios
          </h2>
          {center.services.length === 0 ? (
            <p className="text-sm text-muted-foreground">Este centro aún no publica servicios.</p>
          ) : (
            <ul className="divide-y rounded-xl border bg-card">
              {center.services.map((service) => (
                <li key={service.id} className="flex items-center gap-4 px-4 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{service.name}</p>
                    <p className="flex gap-3 text-sm text-muted-foreground">
                      <span>{formatDuration(service.duration_minutes)}</span>
                      <span className="tabular-nums">{formatCLP(service.price_clp)}</span>
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="h-10 px-4"
                    aria-label={`Agendar ${service.name}`}
                    nativeButton={false}
                    render={<Link href={`${bookingPath}?by=service&service=${service.id}`} />}
                  >
                    Agendar
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="professionals-heading" className="space-y-4">
          <h2 id="professionals-heading" className="text-xl font-semibold tracking-tight">
            Profesionales
          </h2>
          {center.professionals.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Este centro aún no tiene profesionales con agenda.
            </p>
          ) : (
            <ul className="divide-y rounded-xl border bg-card">
              {center.professionals.map((professional) => (
                <li
                  key={professional.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-4"
                >
                  <div className="flex min-w-0 flex-1 basis-56 items-center gap-3">
                    <ProfessionalAvatar professional={professional} />
                    <div className="flex min-w-0 flex-col">
                      <p className="font-medium">{professional.full_name}</p>
                      <ProfessionalSubtitle professional={professional} />
                    </div>
                  </div>
                  <ProfessionalProfileDialog professional={professional} />
                  <Button
                    variant="outline"
                    className="h-10 w-full px-4 sm:w-auto"
                    nativeButton={false}
                    render={
                      <Link href={`${bookingPath}?by=professional&professional=${professional.id}`} />
                    }
                  >
                    Agendar con {professional.full_name}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {center.terms ? (
          <details className="group rounded-xl border bg-card lg:col-span-2">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 py-3 font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
              Términos y condiciones
              <ChevronDown
                className="size-4 text-muted-foreground transition-transform group-open:rotate-180 motion-reduce:transition-none"
                aria-hidden="true"
              />
            </summary>
            <p className="max-w-prose px-4 pb-4 text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
              {center.terms}
            </p>
          </details>
        ) : null}
      </main>
    </div>
  )
}

function SocialLinksList({ center }: { center: PublicCenter }) {
  const links = SOCIAL_NETWORKS.filter(({ field }) => center[field])
  if (links.length === 0) return null
  return (
    <ul className="mt-4 flex flex-wrap gap-2" aria-label={`Redes de ${center.name}`}>
      {links.map(({ field, label, icon: Icon }) => (
        <li key={field}>
          <a
            href={socialHref(field, center[field])}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${label} de ${center.name} (se abre en una pestaña nueva)`}
            className="inline-flex h-9 items-center gap-2 rounded-full border bg-card px-3 text-sm font-medium transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <Icon className="size-4" />
            {label}
          </a>
        </li>
      ))}
    </ul>
  )
}
