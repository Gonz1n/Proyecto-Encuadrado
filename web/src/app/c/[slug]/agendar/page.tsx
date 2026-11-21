import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { BookingPage } from '@/features/public-booking/booking-flow'
import { getPublicCenter } from '@/lib/server-api'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const center = await getPublicCenter(slug)
  if (!center) notFound()
  return { title: `${center.name} | Encuadrado`, description: center.description }
}

export default function Page() {
  return (
    <Suspense>
      <BookingPage />
    </Suspense>
  )
}
