import type { PatientFieldName, PatientValues } from '../types/patient'

export const PATIENT_FIELDS: {
  name: PatientFieldName
  label: string
  type: string
  autoComplete: string
  inputMode?: 'email' | 'tel' | 'text'
  maxLength?: number
  placeholder?: string
}[] = [
  { name: 'patient_name', label: 'Nombre y apellido', type: 'text', autoComplete: 'name' },
  { name: 'patient_rut', label: 'RUT', type: 'text', autoComplete: 'off', inputMode: 'text', maxLength: 12, placeholder: '12.345.678-5' },
  { name: 'patient_birth_date', label: 'Fecha de nacimiento', type: 'date', autoComplete: 'bday' },
  { name: 'patient_email', label: 'Correo', type: 'email', autoComplete: 'email', inputMode: 'email', placeholder: 'nombre@correo.cl' },
  { name: 'patient_phone', label: 'Celular', type: 'tel', autoComplete: 'tel', inputMode: 'tel', placeholder: '+56 9 1234 5678' },
]

export const PATIENT_FIELD_NAMES = PATIENT_FIELDS.map((field) => field.name)

export const EMPTY_PATIENT = Object.fromEntries(PATIENT_FIELD_NAMES.map((name) => [name, ''])) as PatientValues
