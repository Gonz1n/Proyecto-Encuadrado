'use client'

import { Button } from '@/components/ui/button'

export function AgendaError({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-2xl border border-primary/40 bg-accent p-5">
      <p className="text-sm font-medium text-primary">No pudimos cargar la agenda.</p>
      <Button variant="outline" onClick={onRetry}>
        Reintentar
      </Button>
    </div>
  )
}
