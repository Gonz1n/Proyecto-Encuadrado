import type { ComponentType, SVGProps } from 'react'
import { Globe } from 'lucide-react'
import { FacebookIcon, InstagramIcon, LinkedInIcon, WhatsAppIcon } from '@/components/brand-icons'
import { PHONE_ERROR, PHONE_PATTERN } from '@/lib/phone'

type IconProps = SVGProps<SVGSVGElement>

export type SocialLinks = {
  website_url: string
  instagram_url: string
  facebook_url: string
  linkedin_url: string
  whatsapp_number: string
}

type SocialField = keyof SocialLinks

export const SOCIAL_NETWORKS: {
  field: SocialField
  label: string
  placeholder: string
  domain?: string
  phone?: boolean
  icon: ComponentType<IconProps>
}[] = [
  {
    field: 'website_url',
    label: 'Sitio web',
    placeholder: 'https://www.tucentro.cl',
    icon: Globe,
  },
  {
    field: 'instagram_url',
    label: 'Instagram',
    placeholder: 'https://www.instagram.com/tucentro',
    domain: 'instagram.com',
    icon: InstagramIcon,
  },
  {
    field: 'facebook_url',
    label: 'Facebook',
    placeholder: 'https://www.facebook.com/tucentro',
    domain: 'facebook.com',
    icon: FacebookIcon,
  },
  {
    field: 'linkedin_url',
    label: 'LinkedIn',
    placeholder: 'https://www.linkedin.com/company/tucentro',
    domain: 'linkedin.com',
    icon: LinkedInIcon,
  },
  {
    field: 'whatsapp_number',
    label: 'WhatsApp',
    placeholder: '+56 9 1234 5678',
    phone: true,
    icon: WhatsAppIcon,
  },
]

export function socialHref(field: SocialField, value: string): string {
  return field === 'whatsapp_number' ? `https://wa.me/${value.replace(/\D/g, '')}` : value
}

export function phoneError(value: string): string | null {
  return !value || PHONE_PATTERN.test(value.trim()) ? null : PHONE_ERROR
}

export function socialLinkError(value: string, domain?: string, label?: string): string | null {
  if (!value) return null
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return 'Ingresa un enlace válido, por ejemplo https://...'
  }
  if (!['http:', 'https:'].includes(url.protocol)) return 'El enlace debe comenzar con http:// o https://'
  if (domain && url.hostname.replace(/^www\./, '') !== domain) return `El enlace debe ser de ${label}`
  return null
}
