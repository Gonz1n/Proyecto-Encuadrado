import { profileSchema, type ProfileValues } from '../schemas/profile-schema'

export const PROFILE_FIELDS = Object.keys(profileSchema.shape) as (keyof ProfileValues)[]

export const PROFILE_TEXT_FIELDS: { name: keyof ProfileValues; label: string; placeholder?: string; inputMode?: 'numeric' }[] = [
  { name: 'first_name', label: 'Nombre' },
  { name: 'last_name', label: 'Apellido' },
  { name: 'title', label: 'Profesión', placeholder: 'Psicóloga clínica' },
  { name: 'university', label: 'Universidad', placeholder: 'Universidad de Chile' },
  {
    name: 'health_registry',
    label: 'N° de registro en la Superintendencia de Salud',
    placeholder: '123456',
    inputMode: 'numeric',
  },
]
