'use client'

import { Button } from '@/components/ui/button'

export function AgendaError({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3">
      <p className="text-sm text-destructive">No pudimos cargar la agenda.</p>
      <Button variant="outline" onClick={onRetry}>
        Reintentar
      </Button>
    </div>
  )
}
