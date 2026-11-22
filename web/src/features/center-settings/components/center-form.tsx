'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Lock } from 'lucide-react'
import type { ReactNode } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CharCount } from '@/components/form/char-count'
import { Field } from '@/components/form/field'
import { FieldError } from '@/components/form/field-error'
import { PendingLabel } from '@/components/form/pending-label'
import { SOCIAL_NETWORKS } from '@/constants/social-networks'
import type { Center, CenterUpdate } from '@/features/center/types/center'
import { cancelledMessage } from '../utils/cancelled-message'
import { handleMutationError } from '@/utils/mutation-errors'
import { useUpdateCenter } from '@/features/center/hooks/use-center'
import { CENTER_FIELDS, CONTACT_FIELDS } from '../constants/center-form'
import { DESCRIPTION_MAX, TERMS_MAX } from '../constants/limits'
import { centerSchema, type CenterValues } from '../schemas/center-schema'
import { OpenDaysPicker } from './open-days-picker'

const time = (value: string | null) => value?.slice(0, 5) ?? ''

function toValues(center: Center): CenterValues {
  return {
    ...(Object.fromEntries(CENTER_FIELDS.map((field) => [field, center[field]])) as CenterValues),
    opening_time: time(center.opening_time),
    closing_time: time(center.closing_time),
    lunch_start: time(center.lunch_start),
    lunch_end: time(center.lunch_end),
  }
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-4 border-t pt-5">
      <legend className="sr-only">{title}</legend>
      <div aria-hidden="true">
        <h3 className="text-sm font-bold text-primary">{title}</h3>
        <p className="text-sm text-muted-foreground">Opcionales. Se muestran en el perfil público del centro.</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">{children}</div>
    </fieldset>
  )
}

export function CenterForm({ slug, center, canEdit }: { slug: string; center: Center; canEdit: boolean }) {
  const update = useUpdateCenter(slug)
  const {
    register,
    handleSubmit,
    setError,
    reset,
    control,
    formState: { errors, dirtyFields, isDirty, isSubmitting },
  } = useForm<CenterValues>({ resolver: zodResolver(centerSchema), defaultValues: toValues(center) })
  const [description, terms] = useWatch({ control, name: ['description', 'terms'] })
  const lunchAria = {
    'aria-invalid': errors.lunch_end ? true : undefined,
    'aria-describedby': errors.lunch_end ? 'center-lunch-error' : undefined,
  } as const

  const onSubmit = handleSubmit(async (values) => {
    const body = Object.fromEntries(
      CENTER_FIELDS.filter((field) => dirtyFields[field]).map((field) => [field, values[field]]),
    ) as CenterUpdate
    const lunchChanged = Boolean(dirtyFields.lunch_start || dirtyFields.lunch_end)
    if (lunchChanged) {
      body.lunch_start = values.lunch_start || null
      body.lunch_end = values.lunch_end || null
    }
    try {
      const saved = await update.mutateAsync(body)
      reset(toValues(saved))
      toast.success(
        lunchChanged ? cancelledMessage('Colación guardada.', saved.cancelled_appointments) : 'Cambios guardados',
      )
    } catch (error) {
      handleMutationError(error, setError, CENTER_FIELDS)
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {canEdit ? null : (
        <p className="flex items-start gap-2 rounded-lg border bg-muted/50 px-3 py-2.5 text-sm text-muted-foreground">
          <Lock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Solo los administradores pueden editar la configuración del centro
        </p>
      )}
      <fieldset disabled={!canEdit} className="space-y-5">
        <Field id="center-name" label="Nombre" error={errors.name?.message}>
          {(props) => <Input {...props} autoComplete="off" {...register('name')} />}
        </Field>
        <Field
          id="center-description"
          label="Descripción"
          hint={<CharCount count={description.length} max={DESCRIPTION_MAX} />}
          error={errors.description?.message}
        >
          {(props) => <Textarea {...props} rows={4} {...register('description')} />}
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="center-opening" label="Horario de inicio" error={errors.opening_time?.message}>
            {(props) => <Input {...props} type="time" {...register('opening_time')} />}
          </Field>
          <Field id="center-closing" label="Horario de término" error={errors.closing_time?.message}>
            {(props) => <Input {...props} type="time" {...register('closing_time')} />}
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="center-lunch-start">Inicio de colación</Label>
            <Input id="center-lunch-start" type="time" {...lunchAria} {...register('lunch_start')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="center-lunch-end">Término de colación</Label>
            <Input id="center-lunch-end" type="time" {...lunchAria} {...register('lunch_end')} />
          </div>
          <div className="sm:col-span-2 -mt-3 space-y-1">
            <p className="text-sm text-muted-foreground">
              Opcional. En ese tramo no se agendan citas. Deja ambos campos vacíos para no tener colación.
            </p>
            <FieldError id="center-lunch-error" message={errors.lunch_end?.message} />
          </div>
        </div>
        <Controller
          control={control}
          name="open_days"
          render={({ field }) => (
            <OpenDaysPicker value={field.value} error={errors.open_days?.message} onChange={field.onChange} />
          )}
        />
        <Field
          id="center-terms"
          label="Términos y condiciones"
          hint={<CharCount count={terms.length} max={TERMS_MAX} />}
          error={errors.terms?.message}
        >
          {(props) => <Textarea {...props} rows={8} {...register('terms')} />}
        </Field>
        <Section title="Redes sociales">
          {SOCIAL_NETWORKS.map(({ field, label, placeholder, phone, icon: Icon }) => (
            <Field
              key={field}
              id={`center-${field}`}
              label={<><Icon className="size-4 text-muted-foreground" />{label}</>}
              error={errors[field]?.message}
            >
              {(props) => (
                <Input
                  {...props}
                  type={phone ? 'tel' : 'url'}
                  inputMode={phone ? 'tel' : 'url'}
                  autoComplete={phone ? 'tel' : 'url'}
                  placeholder={placeholder}
                  {...register(field)}
                />
              )}
            </Field>
          ))}
        </Section>
        <Section title="Contacto y ubicación">
          {CONTACT_FIELDS.map(({ field, label, placeholder, type, autoComplete }) => (
            <Field key={field} id={`center-${field}`} label={label} error={errors[field]?.message}>
              {(props) => (
                <Input
                  {...props}
                  type={type}
                  inputMode={type === 'text' ? undefined : type}
                  autoComplete={autoComplete}
                  placeholder={placeholder}
                  {...register(field)}
                />
              )}
            </Field>
          ))}
        </Section>
      </fieldset>
      {canEdit ? (
        <Button type="submit" size="lg" disabled={!isDirty || isSubmitting}>
          {isSubmitting ? <PendingLabel>Guardando…</PendingLabel> : 'Guardar cambios'}
        </Button>
      ) : null}
    </form>
  )
}
