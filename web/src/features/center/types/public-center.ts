import type { SocialLinks } from '@/types/social-links'
import type { Service } from './center'

export type PublicProfessional = {
  id: number
  full_name: string
  title: string
  university: string
  bio: string
  health_registry: string
}

export type PublicService = Service

export type PublicCenterSummary = {
  slug: string
  name: string
  description: string
}

export type PublicCenter = {
  name: string
  slug: string
  description: string
  opening_time: string
  closing_time: string
  terms: string
  open_days: number[]
  professionals: PublicProfessional[]
  services: PublicService[]
  address: string
  commune: string
  phone: string
  email: string
} & SocialLinks
