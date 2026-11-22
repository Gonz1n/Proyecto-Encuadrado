import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import type { PublicCenter } from '@/features/public-booking/api'

async function getPublicCenter(slug: string): Promise<PublicCenter | null> {
  const apiUrl = process.env.API_URL
  if (!apiUrl) throw new Error('API_URL no configurada')
  const response = await fetch(`${apiUrl}/api/public/centers/${slug}/`, { next: { revalidate: 60 } })
  if (response.status === 404) return null
  if (!response.ok) throw new Error(`Error de API ${response.status}`)
  return (await response.json()) as PublicCenter
}

export async function generateCenterMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const center = await getPublicCenter(slug)
  if (!center) notFound()
  return { title: `${center.name} | CentradaMente`, description: center.description }
}
