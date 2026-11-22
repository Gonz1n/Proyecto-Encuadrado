import { ChevronDown, Clock } from 'lucide-react'
import Link from 'next/link'
import { SOCIAL_NETWORKS } from '@/constants/social-networks'
import type { PublicCenter } from '@/features/center/types/public-center'
import { centerPhoto } from '@/utils/center-photos'
import { formatOpenDays } from '@/utils/format'
import { PILL_CLASS } from '../../constants/styles'
import { navLinks } from '../../utils/center-page'
import { PublicHeader } from '../public-header'
import { ContactSection } from './contact-section'
import { LocationSection } from './location-section'
import { ProfessionalsSection } from './professionals-section'
import { ServicesSection } from './services-section'

export function CenterProfile({ center }: { center: PublicCenter }) {
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
              <Link href={bookingPath} className={`${PILL_CLASS} gap-2`}>
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

        <ServicesSection center={center} bookingPath={bookingPath} />
        <ProfessionalsSection center={center} bookingPath={bookingPath} />
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
