import { Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { Label } from '@/components/ui/label'

export function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p id={id} className="text-sm text-destructive">
      {message}
    </p>
  ) : null
}

export function CharCount({ count, max }: { count: number; max: number }) {
  return (
    <span
      className={count > max ? 'text-xs text-destructive tabular-nums' : 'text-xs text-muted-foreground tabular-nums'}
    >
      {count}/{max}
    </span>
  )
}

type FieldControl = { id: string; 'aria-invalid'?: true; 'aria-describedby'?: string }

type FieldProps = {
  id: string
  label: ReactNode
  error?: string
  hint?: ReactNode
  className?: string
  labelClassName?: string
  children: (control: FieldControl) => ReactNode
}

export function Field({ id, label, error, hint, className = 'space-y-2', labelClassName, children }: FieldProps) {
  const labelNode = (
    <Label htmlFor={id} className={labelClassName}>
      {label}
    </Label>
  )
  return (
    <div className={className}>
      {hint ? <div className="flex items-baseline justify-between gap-2">{labelNode}{hint}</div> : labelNode}
      {children({ id, 'aria-invalid': error ? true : undefined, 'aria-describedby': error ? `${id}-error` : undefined })}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  )
}

export function PendingLabel({ children }: { children: ReactNode }) {
  return (
    <>
      <Loader2 className="motion-safe:animate-spin" aria-hidden="true" />
      {children}
    </>
  )
}
