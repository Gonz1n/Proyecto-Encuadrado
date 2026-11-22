'use client'

import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCLP, formatDuration } from '@/utils/format'
import type { Service } from './api'
import { notifyDeleteError } from '@/utils/mutation-errors'
import { useDeleteService, useServices } from './hooks'
import { ServiceFormDialog } from './service-form-dialog'

type OpenDialog = 'form' | 'delete' | null

export function ServicesTable({ slug, canEdit }: { slug: string; canEdit: boolean }) {
  const { data: services, isPending, isError } = useServices(slug)
  const remove = useDeleteService(slug)
  const [open, setOpen] = useState<OpenDialog>(null)
  const [selected, setSelected] = useState<Service | undefined>()
  const close = () => setOpen(null)
  const openDialog = (kind: 'form' | 'delete', service?: Service) => {
    setSelected(service)
    setOpen(kind)
  }

  const confirmDelete = async (service: Service) => {
    try {
      await remove.mutateAsync(service.id)
      toast.success('Servicio eliminado')
    } catch (error) {
      notifyDeleteError(error, 'No pudimos eliminar el servicio. Intenta de nuevo.')
    }
    close()
  }

  return (
    <div className="space-y-4">
      {canEdit ? (
        <div className="flex justify-end">
          <Button onClick={() => openDialog('form')}>
            <Plus aria-hidden="true" />
            Agregar servicio
          </Button>
        </div>
      ) : null}
      {isPending ? (
        <Skeleton className="h-40 w-full" />
      ) : isError ? (
        <p role="alert" className="text-sm text-destructive">
          No pudimos cargar los servicios. Intenta de nuevo.
        </p>
      ) : services.length === 0 ? (
        <p className="rounded-xl border border-dashed bg-muted px-4 py-8 text-center text-sm text-muted-foreground">
          Aún no hay servicios.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead>Duración</TableHead>
                {canEdit ? (
                  <TableHead className="w-24">
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">{service.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCLP(service.price_clp)}</TableCell>
                  <TableCell>{formatDuration(service.duration_minutes)}</TableCell>
                  {canEdit ? (
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" aria-label={`Editar ${service.name}`} onClick={() => openDialog('form', service)}>
                          <Pencil aria-hidden="true" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" aria-label={`Eliminar ${service.name}`} onClick={() => openDialog('delete', service)}>
                          <Trash2 aria-hidden="true" />
                        </Button>
                      </div>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <ServiceFormDialog slug={slug} service={selected} open={open === 'form'} onOpenChange={(open) => (open ? undefined : close())} />
      <AlertDialog open={open === 'delete'} onOpenChange={(open) => (open ? undefined : close())}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{selected ? `Eliminar ${selected.name}` : 'Eliminar servicio'}</AlertDialogTitle>
            <AlertDialogDescription>
              El servicio dejará de estar disponible para nuevos agendamientos. Los agendamientos
              existentes se mantienen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={remove.isPending} onClick={() => selected && confirmDelete(selected)}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
