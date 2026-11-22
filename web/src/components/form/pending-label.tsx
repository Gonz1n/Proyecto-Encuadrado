import { Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'

export function PendingLabel({ children }: { children: ReactNode }) {
  return (
    <>
      <Loader2 className="motion-safe:animate-spin" aria-hidden="true" />
      {children}
    </>
  )
}
