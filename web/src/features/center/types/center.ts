import type { Role } from '@/features/permissions/types/permissions'
import type { SocialLinks } from '@/types/social-links'

export type Center = {
  name: string
  slug: string
  description: string
  opening_time: string
  closing_time: string
  terms: string
  open_days: number[]
  lunch_start: string | null
  lunch_end: string | null
  address: string
  commune: string
  phone: string
  email: string
} & SocialLinks

export type CenterUpdate = Partial<Omit<Center, 'slug'>>

export type Closure = {
  id: number
  date: string
  reason: string
}

export type ClosureCreated = Closure & { cancelled_appointments: number }

export type Service = {
  id: number
  name: string
  price_clp: number
  duration_minutes: number
  description: string
}

export type ServiceInput = Omit<Service, 'id'>

export type Member = {
  id: number
  role: Role
  role_label: string
  user: { full_name: string; email: string; title: string }
}
