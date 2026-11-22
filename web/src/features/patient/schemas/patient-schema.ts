import { z } from 'zod'
import { PHONE_ERROR, PHONE_PATTERN } from '@/constants/phone'
import { normalizeRut } from '../utils/rut'

export const buildPatientShape = (today: string, oldest: string) => ({
  patient_name: z.string().trim().min(3, 'Ingresa tu nombre y apellido').max(120, 'Usa como máximo 120 caracteres'),
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
