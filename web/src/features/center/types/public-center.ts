import type { components } from '@/types/api'

type Schemas = components['schemas']

export type PublicProfessional = Schemas['PublicProfessionalOut']

export type PublicService = Schemas['ServiceOut']

export type PublicCenterSummary = Schemas['CenterListItemOut']

export type PublicCenter = Schemas['PublicCenterOut']
