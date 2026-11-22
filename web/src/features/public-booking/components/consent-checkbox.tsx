import type { ReactNode } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { FieldError } from '@/components/form/field-error'

type ConsentCheckboxProps = {
  id: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  error?: string
  children: ReactNode
}

export function ConsentCheckbox({ id, checked, onCheckedChange, error, children }: ConsentCheckboxProps) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="flex min-h-11 cursor-pointer items-start gap-3 py-2 text-sm leading-snug">
        <Checkbox
          id={id}
          checked={checked}
          onCheckedChange={onCheckedChange}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="mt-0.5 size-5 border-[var(--cp-granate)] bg-white data-checked:border-[var(--cp-granate)] data-checked:bg-[var(--cp-granate)] data-checked:text-white focus-visible:ring-[var(--cp-granate)]/40"
        />
        <span>{children}</span>
      </label>
      <FieldError id={`${id}-error`} message={error} />
    </div>
  )
}
