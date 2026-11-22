'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { View } from '../types/calendar'
import { AGENDA_VIEWS } from '../constants/agenda'

type ViewSwitcherProps = {
  value: View
  viewAll: boolean
  onChange: (view: View) => void
}

export function ViewSwitcher({ value, viewAll, onChange }: ViewSwitcherProps) {
  const views = viewAll ? AGENDA_VIEWS : AGENDA_VIEWS.filter((view) => view.value !== 'dia')
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
