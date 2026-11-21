import type { ReactNode } from 'react'
import { addMinutes, format, parseISO } from 'date-fns'
import Link from 'next/link'
import { formatCLP, formatDuration, formatLongDate } from '@/lib/format'
import { useBookingFlow } from './booking-context'
import type { BookingPatch } from './use-booking-state'

function SummaryRow({
  label,
  change,
  children,
}: {
  label: string
  change: BookingPatch
  children: ReactNode
}) {
  const { state } = useBookingFlow()
  return (
    <div className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0 flex-1">
        <dt className="text-sm text-[var(--cp-granate)]/80">{label}</dt>
        <dd className="mt-0.5">{children}</dd>
      </div>
      <Link
        href={state.hrefFor(change)}
        aria-label={`Cambiar ${label.toLowerCase()}`}
        className="-mr-2 inline-flex min-h-11 shrink-0 items-center rounded-md px-2 text-sm font-semibold text-[var(--cp-granate)] underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-[var(--cp-granate)]/40"
      >
        Cambiar
      </Link>
    </div>
  )
}

export function BookingSummary() {
  const { state } = useBookingFlow()
  const { service, professional, date, time } = state
  if (!service && !professional) return null

  return (
    <section aria-labelledby="booking-summary-heading" className="rounded-3xl border border-[var(--cp-granate)] bg-[var(--cp-card)] p-5">
      <h2 id="booking-summary-heading" className="mb-3 border-b border-[var(--cp-terracota)] pb-2 font-bold tracking-tight">
        Tu reserva
      </h2>
      <dl className="divide-y divide-[var(--cp-terracota)]/50">
        {service ? (
          <SummaryRow label="Servicio" change={{ service: null }}>
            <p className="font-medium">{service.name}</p>
            <p className="flex gap-3 text-sm text-[var(--cp-granate)]/80">
              <span>{formatDuration(service.duration_minutes)}</span>
              <span className="tabular-nums">{formatCLP(service.price_clp)}</span>
            </p>
          </SummaryRow>
        ) : null}
        {professional ? (
          <SummaryRow label="Profesional" change={{ professional: null }}>
            <p className="font-medium">{professional.full_name}</p>
            {professional.title ? (
              <p className="text-sm text-[var(--cp-granate)]/80">{professional.title}</p>
            ) : null}
          </SummaryRow>
        ) : null}
        {service && date && time ? (
          <SummaryRow label="Fecha y hora" change={{ date: null }}>
            <p className="font-medium">{formatLongDate(parseISO(date))}</p>
            <p className="text-sm text-[var(--cp-granate)]/80 tabular-nums">
              {time} a {format(addMinutes(parseISO(`${date}T${time}`), service.duration_minutes), 'HH:mm')}
            </p>
          </SummaryRow>
        ) : null}
      </dl>
    </section>
  )
}
