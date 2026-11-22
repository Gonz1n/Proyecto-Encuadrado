'use client'

import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import type { AppointmentChange } from './api'

const stamp = (value: string) => format(parseISO(value), "d MMM, HH:mm", { locale: es })

function describe(change: AppointmentChange) {
  const author = change.changed_by?.full_name ?? 'Un usuario'
  const when = stamp(change.created_at)
  if (change.kind === 'cancelled') return `Cancelada por ${author} el ${when}`
  return `Reagendada por ${author} el ${when}: de ${stamp(change.previous_start)} a ${stamp(change.new_start ?? change.previous_start)}`
}

export function AppointmentHistory({ changes }: { changes: AppointmentChange[] }) {
  if (changes.length === 0) return null
  return (
    <section aria-labelledby="appointment-history" className="space-y-2 border-t pt-4">
      <h3 id="appointment-history" className="text-sm font-medium">Historial</h3>
      <ul className="space-y-2 text-sm">
        {changes.map((change, index) => (
          <li key={index}>
            <p>{describe(change)}</p>
            {change.note && <p className="text-muted-foreground">{change.note}</p>}
          </li>
        ))}
      </ul>
    </section>
  )
}
