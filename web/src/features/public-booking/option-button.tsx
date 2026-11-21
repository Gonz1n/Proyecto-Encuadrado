import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export function OptionButton({ className, ...props }: ComponentProps<'button'>) {
  return (
    <button
      type="button"
      className={cn(
        'flex min-h-16 w-full items-center gap-3 rounded-2xl border border-[var(--cp-granate)]/70 bg-[var(--cp-card)] px-4 py-3 text-left text-[var(--cp-granate)] transition-[transform,background-color,box-shadow] duration-150 ease-out outline-none focus-visible:ring-3 focus-visible:ring-[var(--cp-granate)]/40 focus-visible:ring-offset-2 active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100 aria-pressed:border-[var(--cp-granate)] aria-pressed:bg-[var(--cp-header)] aria-pressed:ring-2 aria-pressed:ring-[var(--cp-granate)] [@media(hover:hover)_and_(pointer:fine)]:hover:bg-[var(--cp-header)]',
        className,
      )}
      {...props}
    />
  )
}
