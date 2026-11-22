'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useParams } from 'next/navigation'
import { NotFoundPage } from '@/components/layout/not-found-page'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { PublicCenter } from '@/features/center/types/public-center'
import { BookingFlowContext, useBookingFlow } from '../contexts/booking-context'
import { BookingSummary } from './booking-summary'
import { isNotFound } from '@/utils/api-errors'
import { usePublicCenter } from '@/features/center/hooks/use-public-center'
import { PublicHeader } from './public-header'
import { ChooseStartStep } from './steps/choose-start-step'
import { PatientStep } from './steps/patient-step'
import { ProfessionalStep } from './steps/professional-step'
import { ServiceStep } from './steps/service-step'
import { SlotStep } from './steps/slot-step'
import { useBookingState } from '../hooks/use-booking-state'
import { type BookingStart, type BookingStep } from '../types/booking-state'
import { EMPTY_DRAFT, STEP_COPY } from '../constants/booking-flow'

function Root({ slug, center, children }: { slug: string; center: PublicCenter; children: ReactNode }) {
  const state = useBookingState(center)
  const [patientDraft, savePatientDraft] = useState(EMPTY_DRAFT)
  return (
    <BookingFlowContext value={{ slug, center, state, patientDraft, savePatientDraft }}>
      {children}
    </BookingFlowContext>
  )
}

function stepNumber(step: BookingStep, first: BookingStart | null): number {
  if (step === 'slot') return 3
  if (step === 'patient') return 4
  return step === first ? 1 : 2
}

function Steps() {
  const { state } = useBookingFlow()
  const { step } = state
  const headingRef = useRef<HTMLHeadingElement>(null)
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    headingRef.current?.focus()
  }, [step])

  const copy = STEP_COPY[step]
  return (
    <section aria-labelledby="booking-step-heading" className="space-y-6">
      <div className="space-y-1.5">
        {step === 'start' ? null : (
          <p className="text-sm font-medium text-[var(--cp-granate)]/80">Paso {stepNumber(step, state.first)} de 4</p>
        )}
        <h1
          id="booking-step-heading"
          ref={headingRef}
          tabIndex={-1}
          className="scroll-mt-6 border-b border-[var(--cp-terracota)] pb-2 text-2xl font-bold tracking-tight text-balance outline-none"
        >
          {copy.title}
        </h1>
        <p className="pt-1 text-[var(--cp-granate)]/80 text-pretty">{copy.description}</p>
      </div>
      {step === 'start' ? <ChooseStartStep /> : null}
      {step === 'service' ? <ServiceStep /> : null}
      {step === 'professional' ? <ProfessionalStep /> : null}
      {step === 'slot' ? <SlotStep /> : null}
      {step === 'patient' ? <PatientStep /> : null}
    </section>
  )
}

export const BookingFlow = { Root, Steps, Summary: BookingSummary }

export function BookingPage() {
  const { slug } = useParams<{ slug: string }>()
  const center = usePublicCenter(slug)

  if (center.isPending) {
    return (
      <div className="center-page min-h-svh"><div className="mx-auto max-w-5xl space-y-4 px-4 py-8 sm:px-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-16 w-full max-w-xl" />
        <Skeleton className="h-16 w-full max-w-xl" />
      </div></div>
    )
  }
  if (center.isError) {
    const missing = isNotFound(center.error)
    return (
      <NotFoundPage
        title={missing ? 'No encontramos este centro' : 'No pudimos cargar la agenda'}
        description={missing ? 'Revisa la dirección que te compartieron.' : 'Revisa tu conexión e intenta de nuevo.'}
        action={missing ? null : <Button onClick={() => center.refetch()}>Reintentar</Button>}
      />
    )
  }

  return (
    <div className="center-page min-h-svh">
      <title>{`Agendar en ${center.data.name}`}</title>
      <PublicHeader slug={slug} />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        <BookingFlow.Root key={slug} slug={slug} center={center.data}>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-10">
            <div className="lg:order-2">
              <div className="lg:sticky lg:top-6">
                <BookingFlow.Summary />
              </div>
            </div>
            <div className="min-w-0 lg:order-1">
              <BookingFlow.Steps />
            </div>
          </div>
        </BookingFlow.Root>
      </main>
    </div>
  )
}
