import { z } from 'zod'
import { PHONE_ERROR, PHONE_PATTERN } from '@/lib/phone'
import { normalizeRut } from '@/lib/rut'

export const buildPatientShape = (today: string, oldest: string) => ({
  patient_name: z
    .string()
    .trim()
    .min(3, 'Ingresa tu nombre y apellido')
    .max(120, 'Usa como máximo 120 caracteres'),
  patient_email: z.string().trim().pipe(z.email('Ingresa un correo válido')),
  patient_phone: z.string().trim().regex(PHONE_PATTERN, PHONE_ERROR),
  patient_rut: z
    .string()
    .trim()
    .refine((value) => normalizeRut(value) !== null, 'Ingresa un RUT válido, por ejemplo 12.345.678-5'),
  patient_birth_date: z
    .string()
    .min(1, 'Ingresa tu fecha de nacimiento')
    .refine((value) => value <= today, 'La fecha de nacimiento no puede ser futura')
    .refine((value) => value >= oldest, 'Revisa la fecha de nacimiento'),
})

export type PatientFieldName =
  | 'patient_name'
  | 'patient_rut'
  | 'patient_birth_date'
  | 'patient_email'
  | 'patient_phone'

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
  {
    name: 'patient_rut',
    label: 'RUT',
    type: 'text',
    autoComplete: 'off',
    inputMode: 'text',
    maxLength: 12,
    placeholder: '12.345.678-5',
  },
  {
    name: 'patient_birth_date',
    label: 'Fecha de nacimiento',
    type: 'date',
    autoComplete: 'bday',
  },
  {
    name: 'patient_email',
    label: 'Correo',
    type: 'email',
    autoComplete: 'email',
    inputMode: 'email',
    placeholder: 'nombre@correo.cl',
  },
  {
    name: 'patient_phone',
    label: 'Celular',
    type: 'tel',
    autoComplete: 'tel',
    inputMode: 'tel',
    placeholder: '+56 9 1234 5678',
  },
]

export const PATIENT_FIELD_NAMES = PATIENT_FIELDS.map((field) => field.name)
