'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { CharCount } from '@/components/form/char-count'
import { Field } from '@/components/form/field'
import { PendingLabel } from '@/components/form/pending-label'
import { type CurrentUser } from '@/features/auth/types/auth'
import { useAuth } from '@/features/auth/contexts/auth-context'
import { handleMutationError } from '@/utils/mutation-errors'
import { initials } from '@/utils/initials'
import { PageTitle } from '@/components/layout/page-title'
import { BIO_MAX } from '../constants/limits'
import { PROFILE_FIELDS, PROFILE_TEXT_FIELDS } from '../constants/profile-form'
import { useUpdateProfile } from '../hooks/use-update-profile'
import { profileSchema, type ProfileValues } from '../schemas/profile-schema'

function toValues(user: CurrentUser): ProfileValues {
  return Object.fromEntries(PROFILE_FIELDS.map((field) => [field, user[field] ?? ''])) as ProfileValues
}

export function ProfilePage() {
  const { user } = useAuth()
  if (!user) return null
  return <ProfileForm key={user.id} user={user} />
}

function ProfileForm({ user }: { user: CurrentUser }) {
  const update = useUpdateProfile()
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
      handleMutationError(error, setError, PROFILE_FIELDS)
    }
  })

  return (
    <div className="space-y-6">
      <title>Mi perfil | CentradaMente</title>
      <div>
        <PageTitle>Mi perfil</PageTitle>
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
          {PROFILE_TEXT_FIELDS.map(({ name, label, placeholder, inputMode }) => (
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
