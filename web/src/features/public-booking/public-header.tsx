import { CalendarDays } from 'lucide-react'
import Link from 'next/link'

export function PublicHeader({ slug, name }: { slug: string; name: string }) {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-14 max-w-5xl items-center px-4 sm:px-6">
        <Link
          href={`/c/${slug}`}
          className="-ml-1 flex min-w-0 items-center gap-2.5 rounded-lg p-1 font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <CalendarDays className="size-4" aria-hidden="true" />
          </span>
          <span className="truncate">{name}</span>
        </Link>
      </div>
    </header>
  )
}
