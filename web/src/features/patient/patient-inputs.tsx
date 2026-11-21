'use client'

import type { FieldErrors, Path, UseFormRegister } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatRutInput } from '@/lib/rut'
import { PATIENT_FIELDS, type PatientFieldName } from './patient-fields'

type PatientValues = Record<PatientFieldName, string>

type PatientInputsProps<T extends PatientValues> = {
  register: UseFormRegister<T>
  errors: FieldErrors<T>
  today: string
  oldest: string
  inputClassName?: string
}

export function PatientInputs<T extends PatientValues>({
  register,
  errors,
  today,
  oldest,
  inputClassName,
}: PatientInputsProps<T>) {
  return PATIENT_FIELDS.map(({ name, label, ...input }) => {
    const path = name as Path<T>
    const error = (errors as FieldErrors<PatientValues>)[name]?.message
    return (
      <div key={name} className="space-y-2">
        <Label htmlFor={name}>{label}</Label>
        <Input
          id={name}
          className={inputClassName}
          spellCheck={false}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${name}-error` : undefined}
          {...input}
          {...(name === 'patient_birth_date' ? { min: oldest, max: today } : {})}
          {...register(path)}
          {...(name === 'patient_rut'
            ? {
                onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
                  event.target.value = formatRutInput(event.target.value)
                  return register(path).onChange(event)
                },
              }
            : {})}
        />
        {error ? (
          <p id={`${name}-error`} className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </div>
    )
  })
}
