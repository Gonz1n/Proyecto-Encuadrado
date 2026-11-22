import Link from 'next/link'
import type { PublicCenter } from '@/features/center/types/public-center'
import { formatCLP, formatDuration } from '@/utils/format'
import { CARD_CLASS, PILL_CLASS } from '../../constants/styles'

export function ServicesSection({ center, bookingPath }: { center: PublicCenter; bookingPath: string }) {
  return (
    <section id="servicios" aria-labelledby="services-heading">
      <div className={`${CARD_CLASS} grid gap-6 p-6 md:grid-cols-[14rem_1fr] md:gap-0 md:p-8`}>
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
                  className={PILL_CLASS}
                >
                  Agendar
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
