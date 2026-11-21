'use client'

import { cn } from '@/lib/utils'
import type { Appointment } from './api'
import { professionalColor } from './calendar-layout'

export function ProfessionalLegend({ professionals }: { professionals: Appointment['professional'][] }) {
  return (
    <ul aria-label="Colores por profesional" className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
      {professionals.map((professional) => (
        <li key={professional.id} className="flex items-center gap-2">
          <span aria-hidden="true" className={cn('h-3.5 w-3 rounded-[3px] border-l-[3px]', professionalColor(professional.id))} />
          {professional.full_name}
        </li>
      ))}
    </ul>
  )
}
