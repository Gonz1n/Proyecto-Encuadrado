'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useParams } from 'next/navigation'
import { NotFoundPage } from '@/components/layout/not-found-page'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { PublicCenter } from './api'
import { BookingFlowContext, useBookingFlow, type PatientDraft } from './booking-context'
import { BookingSummary } from './booking-summary'
import { isNotFound, usePublicCenter } from './hooks'
import { PublicHeader } from './public-header'
import { ChooseStartStep } from './steps/choose-start-step'
import { PatientStep } from './steps/patient-step'
import { ProfessionalStep } from './steps/professional-step'
import { ServiceStep } from './steps/service-step'
import { SlotStep } from './steps/slot-step'
import { useBookingState, type BookingStart, type BookingStep } from './use-booking-state'

const EMPTY_DRAFT: PatientDraft = {
  patient_name: '',
  patient_email: '',
  patient_phone: '',
  patient_rut: '',
  patient_birth_date: '',
  modality: 'in_person',
}

const STEP_COPY: Record<BookingStep, { title: string; description: string }> = {
  start: {
    title: '¿Cómo quieres agendar?',
    description: 'Puedes partir por el servicio o por la persona que te atenderá.',
  },
  service: { title: 'Elige un servicio', description: 'Cada servicio indica su duración y precio.' },
  professional: { title: 'Elige un profesional', description: 'Después verás sus horas libres.' },
  slot: { title: 'Elige día y hora', description: 'Los días sin horas libres aparecen desactivados.' },
  patient: { title: 'Tus datos', description: 'Con estos datos el centro podrá contactarte.' },
}

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
          <p className="text-sm text-muted-foreground">Paso {stepNumber(step, state.first)} de 4</p>
        )}
        <h1
          id="booking-step-heading"
          ref={headingRef}
          tabIndex={-1}
          className="scroll-mt-6 text-2xl font-semibold tracking-tight text-balance outline-none"
        >
          {copy.title}
        </h1>
        <p className="text-muted-foreground text-pretty">{copy.description}</p>
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
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-8 sm:px-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-16 w-full max-w-xl" />
        <Skeleton className="h-16 w-full max-w-xl" />
      </div>
    )
  }
  if (center.isError) {
    return isNotFound(center.error) ? (
      <NotFoundPage
        title="No encontramos este centro"
        description="Revisa la dirección que te compartieron."
        action={null}
      />
    ) : (
      <NotFoundPage
        title="No pudimos cargar la agenda"
        description="Revisa tu conexión e intenta de nuevo."
        action={<Button onClick={() => center.refetch()}>Reintentar</Button>}
      />
    )
  }

  return (
    <div className="min-h-svh bg-background">
      <title>{`Agendar en ${center.data.name}`}</title>
      <PublicHeader slug={slug} name={center.data.name} />
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
