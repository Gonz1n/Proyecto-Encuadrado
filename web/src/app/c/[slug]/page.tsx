import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CenterProfilePage } from '@/features/public-booking/center-profile-page'
import { getPublicCenter } from '@/lib/server-api'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const center = await getPublicCenter(slug)
  if (!center) notFound()
  return { title: `${center.name} | CentradaMente`, description: center.description }
}

export default function Page() {
  return <CenterProfilePage />
}
