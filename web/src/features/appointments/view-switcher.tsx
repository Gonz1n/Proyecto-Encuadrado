'use client'

import { CalendarRange, Columns3, List, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { View } from './calendar-layout'

const VIEWS: { value: View; label: string; icon: LucideIcon }[] = [
  { value: 'lista', label: 'Lista', icon: List },
  { value: 'semana', label: 'Semana', icon: CalendarRange },
  { value: 'dia', label: 'Día', icon: Columns3 },
]

type ViewSwitcherProps = {
  value: View
  viewAll: boolean
  onChange: (view: View) => void
}

export function ViewSwitcher({ value, viewAll, onChange }: ViewSwitcherProps) {
  const views = viewAll ? VIEWS : VIEWS.filter((view) => view.value !== 'dia')
  return (
    <div role="group" aria-label="Vista de la agenda" className="inline-flex w-fit gap-0.5 rounded-lg bg-accent p-0.5">
      {views.map(({ value: view, label, icon: Icon }) => (
        <Button
          key={view}
          variant="ghost"
          size="sm"
          aria-pressed={view === value}
          onClick={() => onChange(view)}
          className={cn(
            'text-muted-foreground',
            view === value && 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
          )}
        >
          <Icon aria-hidden="true" />
          {label}
        </Button>
      ))}
    </div>
  )
}
