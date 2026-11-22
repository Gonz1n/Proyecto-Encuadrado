import { Mail, Phone } from 'lucide-react'
import { WhatsAppIcon } from '@/components/icons/brand-icons'
import { SOCIAL_NETWORKS } from '@/constants/social-networks'
import type { PublicCenter } from '@/features/center/types/public-center'
import { socialHref } from '@/utils/social-links'
import { CONTACT_LINK_CLASS } from '../../constants/styles'
import { telHref } from '../../utils/location'
import { SectionTitle } from './section-title'

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

export function ContactSection({ center }: { center: PublicCenter }) {
  const { phone, email, whatsapp_number: whatsapp } = center
  return (
    <section id="contacto" aria-labelledby="contact-heading" className="space-y-6">
      <SectionTitle id="contact-heading">Contacto</SectionTitle>
      <ul className="space-y-1">
        {phone ? (
          <li>
            <a href={telHref(phone)} className={CONTACT_LINK_CLASS}>
              <Phone className="size-4" aria-hidden="true" />
              {phone}
            </a>
          </li>
        ) : null}
        {email ? (
          <li>
            <a href={`mailto:${email}`} className={`${CONTACT_LINK_CLASS} [overflow-wrap:anywhere]`}>
              <Mail className="size-4 shrink-0" aria-hidden="true" />
              {email}
            </a>
          </li>
        ) : null}
        {whatsapp ? (
          <li>
            <a href={socialHref('whatsapp_number', whatsapp)} target="_blank" rel="noopener noreferrer" className={CONTACT_LINK_CLASS}>
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
