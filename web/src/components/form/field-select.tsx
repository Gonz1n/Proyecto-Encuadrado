import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type FieldSelectProps = {
  label: string
  placeholder?: string
  items: { value: string; label: string }[]
  value: string | null
  disabled?: boolean
  onValueChange: (value: string | null) => void
}

export function FieldSelect({ label, placeholder, items, value, disabled, onValueChange }: FieldSelectProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select items={items} value={value} disabled={disabled} onValueChange={onValueChange}>
        <SelectTrigger aria-label={label} className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
