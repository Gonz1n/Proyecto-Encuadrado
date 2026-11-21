'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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

function ServiceForm({
  slug,
  service,
  onDone,
}: {
  slug: string
  service?: Service
  onDone: () => void
}) {
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
    const body = {
      name: values.name,
      price_clp: Number(values.price_clp),
      duration_minutes: Number(values.duration_minutes),
      description: values.description,
    }
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
      <div className="space-y-2">
        <Label htmlFor="service-name">Nombre</Label>
        <Input
          id="service-name"
          autoComplete="off"
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? 'service-name-error' : undefined}
          {...register('name')}
        />
        {errors.name ? (
          <p id="service-name-error" className="text-sm text-destructive">
            {errors.name.message}
          </p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="service-price">Precio (CLP)</Label>
        <Input
          id="service-price"
          inputMode="numeric"
          autoComplete="off"
          placeholder="25000"
          aria-invalid={errors.price_clp ? true : undefined}
          aria-describedby={errors.price_clp ? 'service-price-error' : undefined}
          {...register('price_clp')}
        />
        {errors.price_clp ? (
          <p id="service-price-error" className="text-sm text-destructive">
            {errors.price_clp.message}
          </p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="service-duration">Duración</Label>
        <Controller
          control={control}
          name="duration_minutes"
          render={({ field }) => (
            <Select
              items={DURATION_OPTIONS}
              value={field.value}
              onValueChange={(value) => field.onChange(value ?? '')}
            >
              <SelectTrigger
                id="service-duration"
                className="w-full"
                aria-invalid={errors.duration_minutes ? true : undefined}
                aria-describedby={errors.duration_minutes ? 'service-duration-error' : undefined}
              >
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
        {errors.duration_minutes ? (
          <p id="service-duration-error" className="text-sm text-destructive">
            {errors.duration_minutes.message}
          </p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="service-description">Descripción (opcional)</Label>
        <Textarea
          id="service-description"
          rows={3}
          aria-invalid={errors.description ? true : undefined}
          aria-describedby={errors.description ? 'service-description-error' : undefined}
          {...register('description')}
        />
        {errors.description ? (
          <p id="service-description-error" className="text-sm text-destructive">
            {errors.description.message}
          </p>
        ) : null}
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="motion-safe:animate-spin" aria-hidden="true" />
              Guardando…
            </>
          ) : (
            'Guardar'
          )}
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
