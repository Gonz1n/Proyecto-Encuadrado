import type { ReactNode } from 'react'
import Link from 'next/link'
import { CalendarX2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

type NotFoundPageProps = {
  title?: string
  description?: string
  action?: ReactNode
}

export function NotFoundPage({
  title = 'No encontramos esta página',
  description = 'La dirección no existe o cambió de lugar.',
  action = (
    <Button nativeButton={false} render={<Link href="/" />}>
      Volver al inicio
    </Button>
  ),
}: NotFoundPageProps) {
  return (
    <main className="center-page flex min-h-svh items-center justify-center px-4 py-16">
      <div className="flex w-full max-w-md flex-col items-start gap-5 rounded-3xl border border-[var(--cp-granate)] bg-[var(--cp-card)] p-6 sm:p-8">
        <span className="flex size-14 items-center justify-center rounded-full bg-[var(--cp-salmon)]">
          <CalendarX2 className="size-7 text-[var(--cp-granate)]" aria-hidden="true" />
        </span>
        <div className="w-full space-y-2">
          <h1 className="border-b border-[var(--cp-terracota)] pb-2 text-2xl font-bold tracking-tight text-balance">
            {title}
          </h1>
          <p className="text-[var(--cp-granate)]/80 text-pretty">{description}</p>
        </div>
        {action}
      </div>
    </main>
  )
}
