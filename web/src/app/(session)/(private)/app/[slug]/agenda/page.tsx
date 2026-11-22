import { Suspense } from 'react'
import { AppointmentsPage } from '@/features/appointments/components/appointments-page'

export default function AgendaPage() {
  return (
    <Suspense>
      <AppointmentsPage />
    </Suspense>
  )
}
