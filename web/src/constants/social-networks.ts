import type { ComponentType, SVGProps } from 'react'
import { Globe } from 'lucide-react'
import { FacebookIcon, InstagramIcon, LinkedInIcon, WhatsAppIcon } from '@/components/icons/brand-icons'
import type { SocialField } from '@/types/social-links'

export const SOCIAL_NETWORKS: {
  field: SocialField
  label: string
  placeholder: string
  phone?: boolean
  icon: ComponentType<SVGProps<SVGSVGElement>>
}[] = [
  { field: 'website_url', label: 'Sitio web', placeholder: 'https://www.tucentro.cl', icon: Globe },
  { field: 'instagram_url', label: 'Instagram', placeholder: 'https://www.instagram.com/tucentro', icon: InstagramIcon },
  { field: 'facebook_url', label: 'Facebook', placeholder: 'https://www.facebook.com/tucentro', icon: FacebookIcon },
  { field: 'linkedin_url', label: 'LinkedIn', placeholder: 'https://www.linkedin.com/company/tucentro', icon: LinkedInIcon },
  { field: 'whatsapp_number', label: 'WhatsApp', placeholder: '+56 9 1234 5678', phone: true, icon: WhatsAppIcon },
]
