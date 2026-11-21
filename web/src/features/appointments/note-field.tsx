'use client'

import { useId } from 'react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { NOTE_MAX } from './hooks'

type NoteFieldProps = {
  value: string
  onChange: (value: string) => void
}

export function NoteField({ value, onChange }: NoteFieldProps) {
  const id = useId()
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Mensaje (opcional)</Label>
      <Textarea
        id={id}
        value={value}
        maxLength={NOTE_MAX}
        rows={3}
        aria-describedby={`${id}-help`}
        onChange={(event) => onChange(event.target.value)}
      />
      <div id={`${id}-help`} className="flex justify-between gap-3 text-xs text-muted-foreground">
        <span>Queda registrado para el equipo del centro. El paciente no lo recibe</span>
        <span className="tabular-nums">
          {value.length}/{NOTE_MAX}
        </span>
      </div>
    </div>
  )
}
