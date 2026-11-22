import { Button } from '@/components/ui/button'
import { FieldError } from '@/components/form/field-error'
import { WEEKDAY_SHORT } from '@/constants/dates'

type OpenDaysPickerProps = {
  value: number[]
  error?: string
  onChange: (days: number[]) => void
}

export function OpenDaysPicker({ value, error, onChange }: OpenDaysPickerProps) {
  return (
    <div className="space-y-2">
      <span id="center-open-days-label" className="text-sm font-medium">
        Días de atención
      </span>
      <div
        role="group"
        aria-labelledby="center-open-days-label"
        aria-describedby={error ? 'center-open-days-error' : undefined}
        className="flex flex-wrap gap-2"
      >
        {WEEKDAY_SHORT.map((label, day) => {
          const active = value.includes(day)
          return (
            <Button
              key={label}
              type="button"
              size="sm"
              variant={active ? 'default' : 'outline'}
              aria-pressed={active}
              className="min-w-12"
              onClick={() =>
                onChange(active ? value.filter((current) => current !== day) : [...value, day].sort((a, b) => a - b))
              }
            >
              {label}
            </Button>
          )
        })}
      </div>
      <FieldError id="center-open-days-error" message={error} />
    </div>
  )
}
