'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Field, PendingLabel } from '@/components/form-field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatDuration } from '@/lib/format'
import type { Service } from './api'
import { handleMutationError, useCreateService, useUpdateService } from './hooks'

const DURATION_OPTIONS = Array.from({ length: 16 }, (_, i) => {
  const minutes = (i + 1) * 15
  return { value: String(minutes), label: formatDuration(minutes) }
})

const serviceSchema = z.object({
  name: z.string().trim().min(1, 'Ingresa el nombre del servicio'),
  price_clp: z
    .string()
    .regex(/^[1-9]\d*$/, 'Ingresa un precio entero mayor a 0')
    .refine((value) => Number(value) <= 10_000_000, 'El precio no puede superar $10.000.000'),
  duration_minutes: z.string().min(1, 'Selecciona la duración'),
  description: z.string().trim().max(300, 'La descripción admite hasta 300 caracteres'),
})

type ServiceValues = z.infer<typeof serviceSchema>

function ServiceForm({ slug, service, onDone }: { slug: string; service?: Service; onDone: () => void }) {
  const create = useCreateService(slug)
  const update = useUpdateService(slug)
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ServiceValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: service?.name ?? '',
      price_clp: service ? String(service.price_clp) : '',
      duration_minutes: service ? String(service.duration_minutes) : '60',
      description: service?.description ?? '',
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    const body = { ...values, price_clp: Number(values.price_clp), duration_minutes: Number(values.duration_minutes) }
    try {
      if (service) {
        await update.mutateAsync({ id: service.id, body })
        toast.success('Servicio actualizado')
      } else {
        await create.mutateAsync(body)
        toast.success('Servicio creado')
      }
      onDone()
    } catch (error) {
      handleMutationError(error, setError, ['name', 'price_clp', 'duration_minutes', 'description'])
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <Field id="service-name" label="Nombre" error={errors.name?.message}>
        {(props) => <Input {...props} autoComplete="off" {...register('name')} />}
      </Field>
      <Field id="service-price" label="Precio (CLP)" error={errors.price_clp?.message}>
        {(props) => (
          <Input {...props} inputMode="numeric" autoComplete="off" placeholder="25000" {...register('price_clp')} />
        )}
      </Field>
      <Field id="service-duration" label="Duración" error={errors.duration_minutes?.message}>
        {(props) => (
          <Controller
            control={control}
            name="duration_minutes"
            render={({ field }) => (
              <Select items={DURATION_OPTIONS} value={field.value} onValueChange={(value) => field.onChange(value ?? '')}>
                <SelectTrigger {...props} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        )}
      </Field>
      <Field id="service-description" label="Descripción (opcional)" error={errors.description?.message}>
        {(props) => <Textarea {...props} rows={3} {...register('description')} />}
      </Field>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <PendingLabel>Guardando…</PendingLabel> : 'Guardar'}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function ServiceFormDialog({
  slug,
  service,
  open,
  onOpenChange,
}: {
  slug: string
  service?: Service
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{service ? 'Editar servicio' : 'Agregar servicio'}</DialogTitle>
          <DialogDescription>
            {service
              ? 'Los cambios se aplican a los próximos agendamientos.'
              : 'Define el nombre, el precio y cuánto dura el servicio.'}
          </DialogDescription>
        </DialogHeader>
        <ServiceForm slug={slug} service={service} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}
