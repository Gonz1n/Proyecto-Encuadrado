'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

type CalendarNavigationProps = {
  label: string
  previousLabel: string
  nextLabel: string
  onPrevious: () => void
  onToday: () => void
  onNext: () => void
}

export function CalendarNavigation({
  label,
  previousLabel,
  nextLabel,
  onPrevious,
  onToday,
  onNext,
}: CalendarNavigationProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" aria-label={previousLabel} onClick={onPrevious}>
          <ChevronLeft aria-hidden="true" />
        </Button>
        <Button variant="outline" onClick={onToday}>
          Hoy
        </Button>
        <Button variant="outline" size="icon" aria-label={nextLabel} onClick={onNext}>
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>
      <p aria-live="polite" className="font-medium tabular-nums">
        {label}
      </p>
    </div>
  )
}
