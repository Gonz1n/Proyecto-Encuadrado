import type { PublicCenter } from '@/features/public-booking/api'

export async function getPublicCenter(slug: string): Promise<PublicCenter | null> {
  const apiUrl = process.env.API_URL
  if (!apiUrl) throw new Error('API_URL no configurada')
  const response = await fetch(`${apiUrl}/api/public/centers/${slug}/`, { next: { revalidate: 60 } })
  if (response.status === 404) return null
  if (!response.ok) throw new Error(`Error de API ${response.status}`)
  return (await response.json()) as PublicCenter
}
