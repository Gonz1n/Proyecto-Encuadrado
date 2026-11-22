import { z } from 'zod'
import { CONTACT_EMAIL_ERROR, CONTACT_PHONE_ERROR, CONTACT_PHONE_PATTERN } from '@/constants/phone'
import { phoneError, socialLinkError } from '@/utils/social-links'
import { DESCRIPTION_MAX, TERMS_MAX } from '../constants/limits'

const refined = (check: (value: string) => string | null) =>
  z
    .string()
    .trim()
    .superRefine((value, ctx) => {
      const message = check(value)
      if (message) ctx.addIssue({ code: 'custom', message })
    })

const socialLink = (domain?: string, label?: string) => refined((value) => socialLinkError(value, domain, label))

export const centerSchema = z
  .object({
    name: z.string().trim().min(1, 'Ingresa el nombre del centro'),
    description: z.string().max(DESCRIPTION_MAX, `La descripción admite hasta ${DESCRIPTION_MAX} caracteres`),
    terms: z.string().max(TERMS_MAX, `Los términos admiten hasta ${TERMS_MAX} caracteres`),
    opening_time: z.string().min(1, 'Ingresa el horario de inicio'),
    closing_time: z.string().min(1, 'Ingresa el horario de término'),
    open_days: z.array(z.number()).min(1, 'Selecciona al menos un día de atención'),
    lunch_start: z.string(),
    lunch_end: z.string(),
    website_url: socialLink(),
    instagram_url: socialLink('instagram.com', 'Instagram'),
    facebook_url: socialLink('facebook.com', 'Facebook'),
    linkedin_url: socialLink('linkedin.com', 'LinkedIn'),
    whatsapp_number: refined(phoneError),
    address: z.string().trim().max(200, 'La dirección admite hasta 200 caracteres'),
    commune: z.string().trim().max(80, 'La comuna admite hasta 80 caracteres'),
    phone: z
      .string()
      .trim()
      .refine(
        (value) => !value || (CONTACT_PHONE_PATTERN.test(value) && value.replace(/\D/g, '').length >= 8),
        CONTACT_PHONE_ERROR,
      ),
    email: z
      .string()
      .trim()
      .refine((value) => !value || z.email().safeParse(value).success, CONTACT_EMAIL_ERROR),
  })
  .refine((v) => !v.opening_time || !v.closing_time || v.closing_time > v.opening_time, {
    path: ['closing_time'],
    message: 'El horario de término debe ser posterior al de inicio',
  })
  .refine((v) => Boolean(v.lunch_start) === Boolean(v.lunch_end), {
    path: ['lunch_end'],
    message: 'Indica inicio y término de la colación',
  })
  .refine((v) => !v.lunch_start || !v.lunch_end || v.lunch_end > v.lunch_start, {
    path: ['lunch_end'],
    message: 'El término de la colación debe ser posterior al inicio',
  })

export type CenterValues = z.infer<typeof centerSchema>
