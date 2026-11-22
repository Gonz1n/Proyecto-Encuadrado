import type { Role } from '@/features/permissions/types/permissions'
import type { components } from '@/types/api'

type Schemas = components['schemas']

export type Center = Schemas['CenterOut']

export type CenterUpdate = Schemas['CenterUpdate']

export type CenterUpdated = Schemas['CenterUpdatedOut']

export type Closure = Schemas['ClosureOut']

export type ClosureInput = Schemas['ClosureIn']

export type ClosureCreated = Schemas['ClosureCreatedOut']

export type Service = Schemas['ServiceOut']

export type ServiceInput = Schemas['ServiceIn']

export type ServiceUpdate = Schemas['ServiceUpdate']

export type Member = Omit<Schemas['MemberOut'], 'role'> & { role: Role }
