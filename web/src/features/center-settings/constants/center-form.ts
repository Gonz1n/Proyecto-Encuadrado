import { centerSchema, type CenterValues } from '../schemas/center-schema'

export const CENTER_FIELDS = Object.keys(centerSchema.shape) as (keyof CenterValues)[]

export const CONTACT_FIELDS = [
  { field: 'address', label: 'Dirección', placeholder: 'Av. Providencia 1234, oficina 5', type: 'text', autoComplete: 'street-address' },
  { field: 'commune', label: 'Comuna', placeholder: 'Providencia', type: 'text', autoComplete: 'address-level2' },
  { field: 'phone', label: 'Teléfono', placeholder: '+56 2 2345 6789', type: 'tel', autoComplete: 'tel' },
  { field: 'email', label: 'Correo', placeholder: 'contacto@tucentro.cl', type: 'email', autoComplete: 'email' },
] as const
