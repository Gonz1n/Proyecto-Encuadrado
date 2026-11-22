'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Field } from '@/components/form/field'
import { PendingLabel } from '@/components/form/pending-label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Service } from '@/features/center/types/center'
import { handleMutationError } from '@/utils/mutation-errors'
import { useCreateService, useUpdateService } from '@/features/center/hooks/use-services'
import { DURATION_OPTIONS, SERVICE_FIELDS } from '../constants/service-form'
import { serviceSchema, type ServiceValues } from '../schemas/service-schema'

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
      handleMutationError(error, setError, SERVICE_FIELDS)
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
