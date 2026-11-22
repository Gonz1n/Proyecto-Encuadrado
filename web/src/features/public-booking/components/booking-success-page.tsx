'use client'

import { format, parseISO } from 'date-fns'
import { useEffect, useState } from 'react'
import { CircleCheck } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { NotFoundPage } from '@/components/layout/not-found-page'
import { Button } from '@/components/ui/button'
import { formatCLP, formatLongDate } from '@/utils/format'
import type { Booking } from '../types/booking'
import { readBooking } from '../utils/booking-storage'
import { PublicHeader } from './public-header'
import { MODALITY_LABELS } from '@/constants/modality'

export function BookingSuccessPage() {
  const { slug } = useParams<{ slug: string }>()
  const [booking, setBooking] = useState<Booking | null | undefined>(undefined)
  useEffect(() => setBooking(readBooking(slug)), [slug])
  const backToProfile = (
    <Button className="h-11 rounded-full px-5 active:scale-[0.97] motion-reduce:active:scale-100" nativeButton={false} render={<Link href={`/c/${slug}`} />}>
      Volver al perfil del centro
    </Button>
  )

  if (booking === undefined) return null

  if (!booking?.id) {
    return (
      <NotFoundPage
        title="No hay una reserva para mostrar"
        description="Si ya agendaste, revisa los datos que te entregó el centro."
        action={backToProfile}
      />
    )
  }

  const start = parseISO(booking.start)
  const rows = [
    { label: 'Centro', value: booking.center.name },
    { label: 'Profesional', value: booking.professional.full_name },
    { label: 'Servicio', value: booking.service.name },
    { label: 'Modalidad', value: MODALITY_LABELS[booking.modality] },
    { label: 'Fecha', value: formatLongDate(start) },
    { label: 'Hora', value: `${format(start, 'HH:mm')} a ${format(parseISO(booking.end), 'HH:mm')}` },
    { label: 'Precio', value: formatCLP(booking.service.price_clp) },
  ]

  return (
    <div className="center-page min-h-svh">
      <title>{`Hora agendada | ${booking.center.name}`}</title>
      <PublicHeader slug={booking.center.slug} />
      <main className="mx-auto max-w-lg px-4 py-10 sm:px-6 sm:py-16">
        <span className="flex size-16 items-center justify-center rounded-full bg-[var(--cp-salmon)]">
          <CircleCheck className="size-9 text-[var(--cp-granate)]" aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-balance sm:text-3xl">
          Tu hora quedó agendada
        </h1>
        <p className="mt-2 text-[var(--cp-granate)]/80 text-pretty">
          Guarda estos datos para el día de tu atención.
        </p>
        <dl className="mt-8 divide-y divide-[var(--cp-terracota)]/50 rounded-3xl border border-[var(--cp-granate)] bg-[var(--cp-card)] px-5">
          {rows.map(({ label, value }) => (
            <div key={label} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-3">
              <dt className="text-sm text-[var(--cp-granate)]/80">{label}</dt>
              <dd className="font-medium tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-8">{backToProfile}</div>
      </main>
    </div>
  )
}
