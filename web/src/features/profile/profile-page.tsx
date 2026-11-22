'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CharCount, FieldError } from '@/components/form-field'
import { authApi, type CurrentUser, type ProfileUpdate } from '@/features/auth/api'
import { useAuth } from '@/features/auth/auth-context'
import { handleMutationError } from '@/features/center-settings/hooks'
import { queryKeys } from '@/lib/query-keys'

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

const FIELDS = [
  'first_name',
  'last_name',
  'title',
  'university',
  'bio',
  'health_registry',
] as const

const TEXT_FIELDS: { name: (typeof FIELDS)[number]; label: string; placeholder?: string; inputMode?: 'numeric' }[] = [
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
    mutationFn: (body: ProfileUpdate) => authApi.updateProfile(body),
    onSuccess: (saved) => {
      queryClient.setQueryData(queryKeys.me, saved)
      queryClient.invalidateQueries({ queryKey: ['public-center'] })
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
  const [bio, firstName, lastName] = useWatch({
    control,
    name: ['bio', 'first_name', 'last_name'],
  })

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
              {`${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {TEXT_FIELDS.map(({ name, label, placeholder, inputMode }) => (
            <div
              key={name}
              className={name === 'health_registry' ? 'space-y-2 sm:col-span-2' : 'space-y-2'}
            >
              <Label htmlFor={`profile-${name}`}>{label}</Label>
              <Input
                id={`profile-${name}`}
                placeholder={placeholder}
                inputMode={inputMode}
                aria-invalid={errors[name] ? true : undefined}
                aria-describedby={errors[name] ? `profile-${name}-error` : undefined}
                {...register(name)}
              />
              <FieldError id={`profile-${name}-error`} message={errors[name]?.message} />
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <Label htmlFor="profile-bio">Descripción</Label>
            <CharCount count={bio.length} max={BIO_MAX} />
          </div>
          <Textarea
            id="profile-bio"
            rows={5}
            placeholder="Cuéntale a tus pacientes cómo trabajas y en qué te especializas."
            aria-invalid={errors.bio ? true : undefined}
            aria-describedby={errors.bio ? 'profile-bio-error' : undefined}
            {...register('bio')}
          />
          <FieldError id="profile-bio-error" message={errors.bio?.message} />
        </div>
        <Button type="submit" size="lg" disabled={!isDirty || isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="motion-safe:animate-spin" aria-hidden="true" />
              Guardando…
            </>
          ) : (
            'Guardar perfil'
          )}
        </Button>
      </form>
    </div>
  )
}
