import { z } from 'zod'

export const serviceSchema = z.object({
  name: z.string().trim().min(1, 'Ingresa el nombre del servicio'),
  price_clp: z
    .string()
    .regex(/^[1-9]\d*$/, 'Ingresa un precio entero mayor a 0')
    .refine((value) => Number(value) <= 10_000_000, 'El precio no puede superar $10.000.000'),
  duration_minutes: z.string().min(1, 'Selecciona la duración'),
  description: z.string().trim().max(300, 'La descripción admite hasta 300 caracteres'),
})

export type ServiceValues = z.infer<typeof serviceSchema>
