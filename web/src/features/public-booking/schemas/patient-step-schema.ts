import { z } from 'zod'
import { buildPatientShape } from '@/features/patient/schemas/patient-schema'
import { CONSENT_ERROR, TERMS_ERROR } from '../constants/consent'

export const buildPatientStepSchema = (today: string, oldest: string) =>
  z.object({
    ...buildPatientShape(today, oldest),
    modality: z.enum(['in_person', 'remote']),
    accept_terms: z.boolean().refine(Boolean, TERMS_ERROR),
    data_consent: z.boolean().refine(Boolean, CONSENT_ERROR),
  })
