import type { ReactNode } from 'react'

export function PageTitle({ children }: { children: ReactNode }) {
  return <h1 className="border-b-2 border-primary pb-1.5 text-2xl font-bold tracking-tight text-primary">{children}</h1>
}
