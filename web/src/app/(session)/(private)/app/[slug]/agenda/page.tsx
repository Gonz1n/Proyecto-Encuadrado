import { Suspense } from 'react'
import { AppointmentsPage } from '@/features/appointments/appointments-page'

export default function AgendaPage() {
  return (
    <Suspense>
      <AppointmentsPage />
    </Suspense>
  )
}
