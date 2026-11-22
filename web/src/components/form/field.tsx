import type { ReactNode } from 'react'
import { Label } from '@/components/ui/label'
import { FieldError } from './field-error'

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
