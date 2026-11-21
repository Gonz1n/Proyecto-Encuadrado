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
    <main className="flex min-h-svh items-center justify-center px-4 py-16">
      <div className="flex max-w-sm flex-col items-start gap-4">
        <CalendarX2 className="size-6 text-muted-foreground" aria-hidden="true" />
        <div className="space-y-1.5">
          <h1 className="text-xl font-semibold tracking-tight text-balance">{title}</h1>
          <p className="text-sm text-muted-foreground text-pretty">{description}</p>
        </div>
        {action}
      </div>
    </main>
  )
}
