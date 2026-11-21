'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Lock } from 'lucide-react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { WEEKDAY_SHORT } from '@/lib/format'
import { CONTACT_EMAIL_ERROR, CONTACT_PHONE_ERROR, CONTACT_PHONE_PATTERN } from '@/lib/phone'
import { SOCIAL_NETWORKS, phoneError, socialLinkError } from '@/lib/social-links'
import type { Center, CenterUpdate } from './api'
import { cancelledMessage } from './cancelled-message'
import { handleMutationError, useUpdateCenter } from './hooks'

const DESCRIPTION_MAX = 400

const socialLink = (domain?: string, label?: string) =>
  z
    .string()
    .trim()
    .superRefine((value, ctx) => {
      const message = socialLinkError(value, domain, label)
      if (message) ctx.addIssue({ code: 'custom', message })
    })

const centerSchema = z
  .object({
    name: z.string().trim().min(1, 'Ingresa el nombre del centro'),
    description: z
      .string()
      .max(DESCRIPTION_MAX, `La descripción admite hasta ${DESCRIPTION_MAX} caracteres`),
    opening_time: z.string().min(1, 'Ingresa el horario de inicio'),
    closing_time: z.string().min(1, 'Ingresa el horario de término'),
    open_days: z.array(z.number()).min(1, 'Selecciona al menos un día de atención'),
    lunch_start: z.string(),
    lunch_end: z.string(),
    website_url: socialLink(),
    instagram_url: socialLink('instagram.com', 'Instagram'),
    facebook_url: socialLink('facebook.com', 'Facebook'),
    linkedin_url: socialLink('linkedin.com', 'LinkedIn'),
    whatsapp_number: z
      .string()
      .trim()
      .superRefine((value, ctx) => {
        const message = phoneError(value)
        if (message) ctx.addIssue({ code: 'custom', message })
      }),
    address: z.string().trim().max(200, 'La dirección admite hasta 200 caracteres'),
    commune: z.string().trim().max(80, 'La comuna admite hasta 80 caracteres'),
    phone: z
      .string()
      .trim()
      .refine(
        (value) =>
          !value ||
          (CONTACT_PHONE_PATTERN.test(value) && value.replace(/\D/g, '').length >= 8),
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

type CenterValues = z.infer<typeof centerSchema>

const FIELDS = [
  'name',
  'description',
  'opening_time',
  'closing_time',
  'open_days',
  'lunch_start',
  'lunch_end',
  'website_url',
  'instagram_url',
  'facebook_url',
  'linkedin_url',
  'whatsapp_number',
  'address',
  'commune',
  'phone',
  'email',
] as const

const CONTACT_FIELDS = [
  { field: 'address', label: 'Dirección', placeholder: 'Av. Providencia 1234, oficina 5', type: 'text', autoComplete: 'street-address' },
  { field: 'commune', label: 'Comuna', placeholder: 'Providencia', type: 'text', autoComplete: 'address-level2' },
  { field: 'phone', label: 'Teléfono', placeholder: '+56 2 2345 6789', type: 'tel', autoComplete: 'tel' },
  { field: 'email', label: 'Correo', placeholder: 'contacto@tucentro.cl', type: 'email', autoComplete: 'email' },
] as const

function toValues(center: Center): CenterValues {
  return {
    name: center.name,
    description: center.description,
    opening_time: center.opening_time.slice(0, 5),
    closing_time: center.closing_time.slice(0, 5),
    open_days: center.open_days,
    lunch_start: center.lunch_start?.slice(0, 5) ?? '',
    lunch_end: center.lunch_end?.slice(0, 5) ?? '',
    website_url: center.website_url,
    instagram_url: center.instagram_url,
    facebook_url: center.facebook_url,
    linkedin_url: center.linkedin_url,
    whatsapp_number: center.whatsapp_number,
    address: center.address,
    commune: center.commune,
    phone: center.phone,
    email: center.email,
  }
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p id={id} className="text-sm text-destructive">
      {message}
    </p>
  ) : null
}

export function CenterForm({
  slug,
  center,
  canEdit,
}: {
  slug: string
  center: Center
  canEdit: boolean
}) {
  const update = useUpdateCenter(slug)
  const {
    register,
    handleSubmit,
    setError,
    reset,
    control,
    formState: { errors, dirtyFields, isDirty, isSubmitting },
  } = useForm<CenterValues>({
    resolver: zodResolver(centerSchema),
    defaultValues: toValues(center),
  })
  const descriptionLength = useWatch({ control, name: 'description' }).length

  const onSubmit = handleSubmit(async (values) => {
    const body = Object.fromEntries(
      FIELDS.filter((field) => dirtyFields[field]).map((field) => [field, values[field]]),
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
        lunchChanged
          ? cancelledMessage('Colación guardada.', saved.cancelled_appointments)
          : 'Cambios guardados',
      )
    } catch (error) {
      handleMutationError(error, setError, FIELDS)
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
        <div className="space-y-2">
          <Label htmlFor="center-name">Nombre</Label>
          <Input
            id="center-name"
            autoComplete="off"
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? 'center-name-error' : undefined}
            {...register('name')}
          />
          <FieldError id="center-name-error" message={errors.name?.message} />
        </div>
        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <Label htmlFor="center-description">Descripción</Label>
            <span
              className={
                descriptionLength > DESCRIPTION_MAX
                  ? 'text-xs text-destructive tabular-nums'
                  : 'text-xs text-muted-foreground tabular-nums'
              }
            >
              {descriptionLength}/{DESCRIPTION_MAX}
            </span>
          </div>
          <Textarea
            id="center-description"
            rows={4}
            aria-invalid={errors.description ? true : undefined}
            aria-describedby={errors.description ? 'center-description-error' : undefined}
            {...register('description')}
          />
          <FieldError id="center-description-error" message={errors.description?.message} />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="center-opening">Horario de inicio</Label>
            <Input
              id="center-opening"
              type="time"
              aria-invalid={errors.opening_time ? true : undefined}
              aria-describedby={errors.opening_time ? 'center-opening-error' : undefined}
              {...register('opening_time')}
            />
            <FieldError id="center-opening-error" message={errors.opening_time?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="center-closing">Horario de término</Label>
            <Input
              id="center-closing"
              type="time"
              aria-invalid={errors.closing_time ? true : undefined}
              aria-describedby={errors.closing_time ? 'center-closing-error' : undefined}
              {...register('closing_time')}
            />
            <FieldError id="center-closing-error" message={errors.closing_time?.message} />
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="center-lunch-start">Inicio de colación</Label>
            <Input
              id="center-lunch-start"
              type="time"
              aria-invalid={errors.lunch_end ? true : undefined}
              aria-describedby={errors.lunch_end ? 'center-lunch-error' : undefined}
              {...register('lunch_start')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="center-lunch-end">Término de colación</Label>
            <Input
              id="center-lunch-end"
              type="time"
              aria-invalid={errors.lunch_end ? true : undefined}
              aria-describedby={errors.lunch_end ? 'center-lunch-error' : undefined}
              {...register('lunch_end')}
            />
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
            <div className="space-y-2">
              <span id="center-open-days-label" className="text-sm font-medium">
                Días de atención
              </span>
              <div
                role="group"
                aria-labelledby="center-open-days-label"
                aria-describedby={errors.open_days ? 'center-open-days-error' : undefined}
                className="flex flex-wrap gap-2"
              >
                {WEEKDAY_SHORT.map((label, day) => {
                  const active = field.value.includes(day)
                  return (
                    <Button
                      key={label}
                      type="button"
                      size="sm"
                      variant={active ? 'default' : 'outline'}
                      aria-pressed={active}
                      className="min-w-12"
                      onClick={() =>
                        field.onChange(
                          active
                            ? field.value.filter((value) => value !== day)
                            : [...field.value, day].sort((a, b) => a - b),
                        )
                      }
                    >
                      {label}
                    </Button>
                  )
                })}
              </div>
              <FieldError id="center-open-days-error" message={errors.open_days?.message} />
            </div>
          )}
        />
        <fieldset className="space-y-4 border-t pt-5">
          <legend className="sr-only">Redes sociales</legend>
          <div aria-hidden="true">
            <h3 className="text-sm font-bold text-primary">Redes sociales</h3>
            <p className="text-sm text-muted-foreground">
              Opcionales. Se muestran en el perfil público del centro.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {SOCIAL_NETWORKS.map(({ field, label, placeholder, phone, icon: Icon }) => (
              <div key={field} className="space-y-2">
                <Label htmlFor={`center-${field}`} className="flex items-center gap-2">
                  <Icon className="size-4 text-muted-foreground" />
                  {label}
                </Label>
                <Input
                  id={`center-${field}`}
                  type={phone ? 'tel' : 'url'}
                  inputMode={phone ? 'tel' : 'url'}
                  autoComplete={phone ? 'tel' : 'url'}
                  placeholder={placeholder}
                  aria-invalid={errors[field] ? true : undefined}
                  aria-describedby={errors[field] ? `center-${field}-error` : undefined}
                  {...register(field)}
                />
                <FieldError id={`center-${field}-error`} message={errors[field]?.message} />
              </div>
            ))}
          </div>
        </fieldset>
        <fieldset className="space-y-4 border-t pt-5">
          <legend className="sr-only">Contacto y ubicación</legend>
          <div aria-hidden="true">
            <h3 className="text-sm font-bold text-primary">Contacto y ubicación</h3>
            <p className="text-sm text-muted-foreground">
              Opcionales. Se muestran en el perfil público del centro.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {CONTACT_FIELDS.map(({ field, label, placeholder, type, autoComplete }) => (
              <div key={field} className="space-y-2">
                <Label htmlFor={`center-${field}`}>{label}</Label>
                <Input
                  id={`center-${field}`}
                  type={type}
                  inputMode={type === 'text' ? undefined : type}
                  autoComplete={autoComplete}
                  placeholder={placeholder}
                  aria-invalid={errors[field] ? true : undefined}
                  aria-describedby={errors[field] ? `center-${field}-error` : undefined}
                  {...register(field)}
                />
                <FieldError id={`center-${field}-error`} message={errors[field]?.message} />
              </div>
            ))}
          </div>
        </fieldset>
      </fieldset>
      {canEdit ? (
        <Button type="submit" size="lg" disabled={!isDirty || isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="motion-safe:animate-spin" aria-hidden="true" />
              Guardando…
            </>
          ) : (
            'Guardar cambios'
          )}
        </Button>
      ) : null}
    </form>
  )
}
