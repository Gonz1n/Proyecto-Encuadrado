import { Suspense } from 'react'
import { BookingPage } from '@/features/public-booking/booking-flow'
import { generateCenterMetadata } from '@/lib/server-api'

export const generateMetadata = generateCenterMetadata

export default function Page() {
  return (
    <Suspense>
      <BookingPage />
    </Suspense>
  )
}
