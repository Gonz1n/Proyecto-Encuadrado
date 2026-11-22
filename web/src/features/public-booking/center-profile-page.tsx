'use client'

import { ChevronDown, Clock, Mail, MapPin, Navigation, Phone } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { NotFoundPage } from '@/components/layout/not-found-page'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCLP, formatDuration, formatOpenDays } from '@/utils/format'
import { WhatsAppIcon } from '@/components/icons/brand-icons'
import { SOCIAL_NETWORKS } from '@/constants/social-networks'
import { socialHref } from '@/utils/social-links'
import type { PublicCenter } from './api'
import { isNotFound } from '@/utils/api-errors'
import { usePublicCenter } from './hooks'
import { centerPhoto } from './center-photos'
import { navLinks, professionalSubtitle } from './center-page'
import { mapsDirectionsUrl, mapsEmbedUrl, telHref } from './location'
import { PublicHeader } from './public-header'
import { ProfessionalAvatar } from './professional-avatar'
import { ProfessionalProfileDialog } from './professional-profile-dialog'

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

const pill =
  'inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-[var(--cp-granate)] px-5 text-sm font-medium text-white transition-[transform,background-color] duration-150 ease-out outline-none focus-visible:ring-3 focus-visible:ring-[var(--cp-granate)]/40 focus-visible:ring-offset-2 active:scale-[0.97] motion-reduce:transition-none [@media(hover:hover)_and_(pointer:fine)]:hover:bg-[#3f221c]'

const card = 'rounded-3xl border border-[var(--cp-granate)] bg-[var(--cp-card)]'

function CenterProfile({ center }: { center: PublicCenter }) {
  const bookingPath = `/c/${center.slug}/agendar`
  const photo = centerPhoto(center.slug)
  const hasContact = Boolean(center.phone || center.email || SOCIAL_NETWORKS.some(({ field }) => center[field]))
  const links = navLinks({
    services: center.services.length > 0,
    professionals: center.professionals.length > 0,
    location: Boolean(center.address),
    contact: hasContact,
  })
  return (
    <div className="center-page min-h-svh">
      <title>{`${center.name} | Agenda en línea`}</title>
      <PublicHeader slug={center.slug} />
      <header className="bg-[var(--cp-header)]">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 py-8 sm:px-6 md:flex-row md:items-center md:gap-10 md:py-10">
          <div className="flex size-36 shrink-0 items-center justify-center rounded-3xl bg-white sm:size-44">
            {photo ? (
              <img src={photo} alt={`Logo de ${center.name}`} className="size-full object-contain p-4" />
            ) : (
              <span aria-hidden="true" className="text-6xl font-semibold">
                {center.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold tracking-tight text-balance [overflow-wrap:break-word] sm:text-3xl">{center.name}</h1>
            <hr className="mt-3 border-[var(--cp-terracota)]" />
            {center.description ? (
              <p className="mt-3 max-w-2xl text-sm text-pretty sm:text-base">{center.description}</p>
            ) : null}
            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-4">
              <p className="flex items-center border-l-4 border-[var(--cp-granate)] pl-3 text-sm font-semibold">
                <span>
                  Atención {formatOpenDays(center.open_days)}
                  <span className="block">{center.opening_time} a {center.closing_time} h</span>
                </span>
              </p>
              <Link href={bookingPath} className={`${pill} gap-2`}>
                <Clock className="size-4" aria-hidden="true" />
                Agendar una hora
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-14 px-4 pt-6 pb-14 sm:px-6">
        {links.length > 0 ? (
          <nav aria-label="Secciones del centro" className="rounded-2xl border border-[var(--cp-granate)]/70 px-2">
            <ul className="flex flex-wrap justify-around">
              {links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-[var(--cp-granate)]/40 [@media(hover:hover)_and_(pointer:fine)]:hover:underline"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        <section id="servicios" aria-labelledby="services-heading">
          <div className={`${card} grid gap-6 p-6 md:grid-cols-[14rem_1fr] md:gap-0 md:p-8`}>
            <h2 id="services-heading" className="self-center text-4xl font-bold tracking-tight md:border-r-4 md:border-[var(--cp-granate)] md:pr-6 md:text-5xl">
              Nuestros servicios
            </h2>
            {center.services.length === 0 ? (
              <p className="self-center text-sm md:pl-6">Este centro aún no publica servicios.</p>
            ) : (
              <ul className="space-y-5 md:pl-6">
                {center.services.map((service) => (
                  <li key={service.id} className="flex items-end gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="border-b border-[var(--cp-granate)] pb-1 font-bold [overflow-wrap:break-word]">{service.name}</p>
                      <p className="mt-1 flex flex-wrap justify-between gap-x-4 text-sm">
                        <span>Duración: {formatDuration(service.duration_minutes)}</span>
                        <span className="tabular-nums">Precio: {formatCLP(service.price_clp)}</span>
                      </p>
                      {service.description ? (
                        <p className="mt-1 text-sm [overflow-wrap:break-word]">{service.description}</p>
                      ) : null}
                    </div>
                    <Link
                      href={`${bookingPath}?by=service&service=${service.id}`}
                      aria-label={`Agendar ${service.name}`}
                      className={pill}
                    >
                      Agendar
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section id="profesionales" aria-labelledby="professionals-heading" className="space-y-6">
          <SectionTitle id="professionals-heading">Nuestros profesionales</SectionTitle>
          {center.professionals.length === 0 ? (
            <p className="text-sm">Este centro aún no tiene profesionales con agenda.</p>
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {center.professionals.map((professional) => {
                const subtitle = professionalSubtitle(professional)
                return (
                  <li key={professional.id} className={`${card} flex flex-col items-center gap-3 p-5 text-center`}>
                    <ProfessionalAvatar
                      professional={professional}
                      className="size-20 after:hidden"
                      fallbackClassName="bg-[var(--cp-salmon)] text-2xl font-semibold text-[var(--cp-granate)]"
                    />
                    <p className="text-lg font-bold [overflow-wrap:break-word]">{professional.full_name}</p>
                    {subtitle ? <p className="text-sm">{subtitle}</p> : null}
                    <hr className="w-full border-[var(--cp-terracota)]" />
                    {professional.bio ? (
                      <p className="line-clamp-4 text-sm text-pretty">{professional.bio}</p>
                    ) : null}
                    <div className="mt-auto flex flex-wrap items-center justify-center gap-2 pt-2">
                      <ProfessionalProfileDialog professional={professional} />
                      <Link
                        href={`${bookingPath}?by=professional&professional=${professional.id}`}
                        aria-label={`Agendar con ${professional.full_name}`}
                        className={pill}
                      >
                        Agendar
                      </Link>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <LocationSection center={center} />
        {hasContact ? <ContactSection center={center} /> : null}

        {center.terms ? (
          <details className="group rounded-2xl border border-[var(--cp-granate)]/70">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-3 font-semibold outline-none focus-visible:ring-3 focus-visible:ring-[var(--cp-granate)]/40 [&::-webkit-details-marker]:hidden">
              Términos y condiciones
              <ChevronDown className="size-4 transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
            </summary>
            <p className="max-w-prose px-4 pb-4 text-sm leading-relaxed whitespace-pre-line">{center.terms}</p>
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
    <ul className="flex flex-wrap gap-2" aria-label={`Redes de ${center.name}`}>
      {links.map(({ field, label, icon: Icon }) => (
        <li key={field}>
          <a
            href={socialHref(field, center[field])}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${label} de ${center.name} (se abre en una pestaña nueva)`}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-[var(--cp-granate)] bg-[var(--cp-card)] px-4 text-sm font-medium transition-[transform,background-color] duration-150 active:scale-[0.97] motion-reduce:transition-none focus-visible:ring-3 focus-visible:ring-[var(--cp-granate)]/40 focus-visible:outline-none [@media(hover:hover)_and_(pointer:fine)]:hover:bg-[var(--cp-header)]"
          >
            <Icon className="size-4" />
            {label}
          </a>
        </li>
      ))}
    </ul>
  )
}

const contactLink =
  'inline-flex min-h-11 items-center gap-2 text-sm font-medium underline-offset-4 focus-visible:ring-3 focus-visible:ring-[var(--cp-granate)]/40 focus-visible:outline-none [@media(hover:hover)_and_(pointer:fine)]:hover:underline'

function SectionTitle({ id, children }: { id: string; children: string }) {
  return (
    <div>
      <h2 id={id} className="text-3xl font-bold tracking-tight sm:text-4xl">
        {children}
      </h2>
      <hr className="mt-3 border-[var(--cp-terracota)]" />
    </div>
  )
}

function LocationSection({ center }: { center: PublicCenter }) {
  const { address, commune } = center
  if (!address) return null
  const embed = mapsEmbedUrl(address, commune)
  const directions = mapsDirectionsUrl(address, commune)
  return (
    <section id="ubicacion" aria-labelledby="location-heading" className="space-y-6">
      <SectionTitle id="location-heading">Ubicación</SectionTitle>
      <div className={embed ? 'grid items-start gap-6 md:grid-cols-2' : ''}>
        <div className="min-w-0 space-y-4">
          <p className="flex items-start gap-2 [overflow-wrap:break-word]">
            <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>
              {address}
              {commune ? <span className="block">{commune}</span> : null}
            </span>
          </p>
          {directions ? (
            <a href={directions} target="_blank" rel="noopener noreferrer" className={`${pill} gap-2`}>
              <Navigation className="size-4" aria-hidden="true" />
              Cómo llegar
              <span className="sr-only"> (se abre en una pestaña nueva)</span>
            </a>
          ) : null}
        </div>
        {embed ? (
          <iframe
            src={embed}
            title={`Mapa de ${center.name}`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-72 w-full rounded-2xl border border-[var(--cp-granate)] bg-white md:h-80"
          />
        ) : null}
      </div>
    </section>
  )
}

function ContactSection({ center }: { center: PublicCenter }) {
  const { phone, email, whatsapp_number: whatsapp } = center
  return (
    <section id="contacto" aria-labelledby="contact-heading" className="space-y-6">
      <SectionTitle id="contact-heading">Contacto</SectionTitle>
      <ul className="space-y-1">
        {phone ? (
          <li>
            <a href={telHref(phone)} className={contactLink}>
              <Phone className="size-4" aria-hidden="true" />
              {phone}
            </a>
          </li>
        ) : null}
        {email ? (
          <li>
            <a href={`mailto:${email}`} className={`${contactLink} [overflow-wrap:anywhere]`}>
              <Mail className="size-4 shrink-0" aria-hidden="true" />
              {email}
            </a>
          </li>
        ) : null}
        {whatsapp ? (
          <li>
            <a href={socialHref('whatsapp_number', whatsapp)} target="_blank" rel="noopener noreferrer" className={contactLink}>
              <WhatsAppIcon className="size-4" />
              WhatsApp
              <span className="sr-only"> (se abre en una pestaña nueva)</span>
            </a>
          </li>
        ) : null}
      </ul>
      <SocialLinksList center={center} />
    </section>
  )
}
