import { Suspense } from 'react'
import { BookingPage } from '@/features/public-booking/booking-flow'
import { generateCenterMetadata } from '@/features/center/api/public-center-server'

export const generateMetadata = generateCenterMetadata

export default function Page() {
  return (
    <Suspense>
      <BookingPage />
    </Suspense>
  )
}
