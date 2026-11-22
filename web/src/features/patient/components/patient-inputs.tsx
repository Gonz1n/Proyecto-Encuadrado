'use client'

import type { FieldErrors, Path, UseFormRegister } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/form/field'
import { formatRutInput } from '../utils/rut'
import { PATIENT_FIELDS } from '../constants/patient-fields'
import type { PatientValues } from '../types/patient'

type PatientInputsProps<T extends PatientValues> = {
  register: UseFormRegister<T>
  errors: FieldErrors<T>
  today: string
  oldest: string
  inputClassName?: string
}

export function PatientInputs<T extends PatientValues>({ register, errors, today, oldest, inputClassName }: PatientInputsProps<T>) {
  return PATIENT_FIELDS.map(({ name, label, ...input }) => {
    const path = name as Path<T>
    const error = (errors as FieldErrors<PatientValues>)[name]?.message
    return (
      <Field key={name} id={name} label={label} error={error}>
        {(props) => (
          <Input
            {...props}
            className={inputClassName}
            spellCheck={false}
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
        )}
      </Field>
    )
  })
}
