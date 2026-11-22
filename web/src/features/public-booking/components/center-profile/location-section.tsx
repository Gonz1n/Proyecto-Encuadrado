import { MapPin, Navigation } from 'lucide-react'
import type { PublicCenter } from '@/features/center/types/public-center'
import { PILL_CLASS } from '../../constants/styles'
import { mapsDirectionsUrl, mapsEmbedUrl } from '../../utils/location'
import { SectionTitle } from './section-title'

export function LocationSection({ center }: { center: PublicCenter }) {
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
            <a href={directions} target="_blank" rel="noopener noreferrer" className={`${PILL_CLASS} gap-2`}>
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
