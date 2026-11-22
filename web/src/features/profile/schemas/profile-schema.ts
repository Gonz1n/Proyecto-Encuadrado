import { z } from 'zod'
import { BIO_MAX } from '../constants/limits'

export const profileSchema = z.object({
  first_name: z.string().trim().min(1, 'Ingresa tu nombre').max(150),
  last_name: z.string().trim().min(1, 'Ingresa tu apellido').max(150),
  title: z.string().trim().max(120, 'Usa como máximo 120 caracteres'),
  university: z.string().trim().max(150, 'Usa como máximo 150 caracteres'),
  bio: z.string().trim().max(BIO_MAX, `La descripción admite hasta ${BIO_MAX} caracteres`),
  health_registry: z
    .string()
    .trim()
    .regex(/^\d{0,10}$/, 'El registro solo admite números, hasta 10 dígitos'),
})

export type ProfileValues = z.infer<typeof profileSchema>
