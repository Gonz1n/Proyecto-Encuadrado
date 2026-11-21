'use client'

import { Loader2, Plus, Trash2 } from 'lucide-react'
import { addDays, format, parseISO, startOfDay } from 'date-fns'
import { es } from 'react-day-picker/locale'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { ApiError } from '@/lib/api-client'
import { formatLongDate } from '@/lib/format'
import { cancelledMessage } from './cancelled-message'
import { useClosures, useCreateClosure, useDeleteClosure } from './hooks'

const REASON_MAX = 120
const DATE_FORMAT = 'yyyy-MM-dd'

function firstError(error: unknown): string | undefined {
  if (!(error instanceof ApiError) || error.status !== 400 || !error.data) return undefined
  const data = error.data as Record<string, unknown>
  for (const field of ['date', 'reason']) {
    const messages = data[field]
    if (Array.isArray(messages) && messages.length > 0) return String(messages[0])
  }
  return undefined
}

export function ClosuresCard({ slug, canEdit }: { slug: string; canEdit: boolean }) {
  const { data: closures, isPending, isError } = useClosures(slug)
  const create = useCreateClosure(slug)
  const remove = useDeleteClosure(slug)
  const [today] = useState(() => startOfDay(new Date()))
  const [date, setDate] = useState<Date | undefined>()
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string>()

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!date) return setError('Selecciona una fecha')
    if (!reason.trim()) return setError('Ingresa el motivo')
    setError(undefined)
    try {
      const created = await create.mutateAsync({
        date: format(date, DATE_FORMAT),
        reason: reason.trim(),
      })
      toast.success(cancelledMessage('Día marcado como cerrado.', created.cancelled_appointments))
      setDate(undefined)
      setReason('')
    } catch (e) {
      const message = firstError(e)
      if (message) setError(message)
      else if (e instanceof ApiError && e.status === 403) toast.error('No tienes permisos para esta acción')
      else toast.error('No pudimos guardar los cambios. Intenta de nuevo.')
    }
  }

  const confirmRemove = async (id: number) => {
    try {
      await remove.mutateAsync(id)
      toast.success('Día reabierto')
    } catch (e) {
      toast.error(
        e instanceof ApiError && e.status === 403
          ? 'No tienes permisos para esta acción'
          : 'No pudimos eliminar el cierre. Intenta de nuevo.',
      )
    }
  }

  return (
    <div className="space-y-6">
      {canEdit ? (
        <form onSubmit={submit} noValidate className="grid gap-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start">
          <div className="w-fit max-w-full rounded-xl border bg-card p-2">
            <Calendar
              mode="single"
              locale={es}
              showOutsideDays={false}
              selected={date}
              onSelect={setDate}
              startMonth={today}
              endMonth={addDays(today, 365)}
              disabled={{ before: today }}
              className="bg-transparent p-0 [--cell-size:--spacing(9)]"
            />
          </div>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {date ? formatLongDate(date) : 'Selecciona un día en el calendario.'}
            </p>
            <div className="space-y-2">
              <Label htmlFor="closure-reason">Motivo</Label>
              <Input
                id="closure-reason"
                maxLength={REASON_MAX}
                autoComplete="off"
                value={reason}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? 'closure-error' : undefined}
                onChange={(event) => setReason(event.target.value)}
              />
              {error ? (
                <p id="closure-error" className="text-sm text-destructive">
                  {error}
                </p>
              ) : null}
            </div>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? (
                <Loader2 className="motion-safe:animate-spin" aria-hidden="true" />
              ) : (
                <Plus aria-hidden="true" />
              )}
              Marcar como cerrado
            </Button>
          </div>
        </form>
      ) : null}
      {isPending ? (
        <Skeleton className="h-24 w-full" />
      ) : isError ? (
        <p role="alert" className="text-sm text-destructive">
          No pudimos cargar los días sin atención. Intenta de nuevo.
        </p>
      ) : closures.length === 0 ? (
        <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          No hay días sin atención próximos.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {closures.map((closure) => (
            <li key={closure.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">{formatLongDate(parseISO(closure.date))}</p>
                <p className="truncate text-sm text-muted-foreground">{closure.reason}</p>
              </div>
              {canEdit ? (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Quitar cierre del ${formatLongDate(parseISO(closure.date))}`}
                  disabled={remove.isPending}
                  onClick={() => confirmRemove(closure.id)}
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
