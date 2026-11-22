'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { CharCount } from '@/components/form/char-count'
import { Field } from '@/components/form/field'
import { PendingLabel } from '@/components/form/pending-label'
import { type CurrentUser } from '@/features/auth/types/auth'
import { type ProfileUpdate } from './types/profile'
import { useAuth } from '@/features/auth/contexts/auth-context'
import { handleMutationError } from '@/utils/mutation-errors'
import { queryKeys } from '@/lib/query-keys'
import { initials } from '@/utils/initials'
import { profileApi } from './api/profile-api'

const BIO_MAX = 500

const profileSchema = z.object({
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

type ProfileValues = z.infer<typeof profileSchema>

const FIELDS = Object.keys(profileSchema.shape) as (keyof ProfileValues)[]

const TEXT_FIELDS: { name: keyof ProfileValues; label: string; placeholder?: string; inputMode?: 'numeric' }[] = [
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

function toValues(user: CurrentUser): ProfileValues {
  return Object.fromEntries(FIELDS.map((field) => [field, user[field] ?? ''])) as ProfileValues
}

export function ProfilePage() {
  const { user } = useAuth()
  if (!user) return null
  return <ProfileForm key={user.id} user={user} />
}

function ProfileForm({ user }: { user: CurrentUser }) {
  const queryClient = useQueryClient()
  const update = useMutation({
    mutationFn: (body: ProfileUpdate) => profileApi.update(body),
    onSuccess: (saved) => {
      queryClient.setQueryData(queryKeys.me, saved)
      queryClient.invalidateQueries({ queryKey: queryKeys.allPublicCenters })
    },
  })
  const {
    register,
    handleSubmit,
    setError,
    reset,
    control,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<ProfileValues>({ resolver: zodResolver(profileSchema), defaultValues: toValues(user) })
  const [bio, firstName, lastName] = useWatch({ control, name: ['bio', 'first_name', 'last_name'] })

  const onSubmit = handleSubmit(async (values) => {
    try {
      const saved = await update.mutateAsync(values)
      reset(toValues(saved))
      toast.success('Perfil actualizado')
    } catch (error) {
      handleMutationError(error, setError, FIELDS)
    }
  })

  return (
    <div className="space-y-6">
      <title>Mi perfil | CentradaMente</title>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary border-b-2 border-primary pb-1.5">Mi perfil</h1>
        <p className="text-sm text-muted-foreground">
          Así te ven los pacientes en el perfil público de los centros donde atiendes.
        </p>
      </div>
      <form onSubmit={onSubmit} noValidate className="max-w-2xl space-y-5">
        <div className="flex items-center gap-4">
          <Avatar className="size-16">
            <AvatarFallback className="bg-primary/10 text-lg font-medium text-primary">
              {initials(firstName, lastName)}
            </AvatarFallback>
          </Avatar>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {TEXT_FIELDS.map(({ name, label, placeholder, inputMode }) => (
            <Field
              key={name}
              id={`profile-${name}`}
              label={label}
              error={errors[name]?.message}
              className={name === 'health_registry' ? 'space-y-2 sm:col-span-2' : 'space-y-2'}
            >
              {(props) => <Input {...props} placeholder={placeholder} inputMode={inputMode} {...register(name)} />}
            </Field>
          ))}
        </div>
        <Field
          id="profile-bio"
          label="Descripción"
          hint={<CharCount count={bio.length} max={BIO_MAX} />}
          error={errors.bio?.message}
        >
          {(props) => (
            <Textarea
              {...props}
              rows={5}
              placeholder="Cuéntale a tus pacientes cómo trabajas y en qué te especializas."
              {...register('bio')}
            />
          )}
        </Field>
        <Button type="submit" size="lg" disabled={!isDirty || isSubmitting}>
          {isSubmitting ? <PendingLabel>Guardando…</PendingLabel> : 'Guardar perfil'}
        </Button>
      </form>
    </div>
  )
}
