import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export function OptionButton({ className, ...props }: ComponentProps<'button'>) {
  return (
    <button
      type="button"
      className={cn(
        'flex min-h-16 w-full items-center gap-3 rounded-xl border bg-card px-4 py-3 text-left transition-colors outline-none hover:border-primary/40 hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 aria-pressed:border-primary aria-pressed:bg-primary/5',
        className,
      )}
      {...props}
    />
  )
}
