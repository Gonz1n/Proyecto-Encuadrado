'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useMembers } from '@/features/center/hooks/use-members'

const ALL = 'all'

type ProfessionalFilterProps = {
  slug: string
  value: number | undefined
  onChange: (value: number | undefined) => void
}

export function ProfessionalFilter({ slug, value, onChange }: ProfessionalFilterProps) {
  const { data: members = [] } = useMembers(slug)
  const professionals = members.filter((member) => member.role !== 'viewer')
  const items = [
    { value: ALL, label: 'Todos los profesionales' },
    ...professionals.map((member) => ({ value: String(member.id), label: member.user.full_name })),
  ]

  return (
    <Select items={items} value={value ? String(value) : ALL} onValueChange={(next) => onChange(next && next !== ALL ? Number(next) : undefined)}>
      <SelectTrigger aria-label="Profesional" className="w-full sm:w-60">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
