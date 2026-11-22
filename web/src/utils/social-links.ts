import { PHONE_ERROR, PHONE_PATTERN } from '@/constants/phone'
import type { SocialField } from '@/types/social-links'

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
