import { useState } from 'react'
import { addDays, addWeeks, format } from 'date-fns'
import { useSearchParams } from 'next/navigation'
import { DATE_FORMAT } from '@/constants/dates'
import { useSetSearchParams } from '@/hooks/use-set-search-params'
import { parseDateParam, resolveView } from '../utils/calendar-layout'

export function useAgendaParams(viewAll: boolean) {
  const searchParams = useSearchParams()
  const setSearchParams = useSetSearchParams()
  const [today] = useState(() => new Date())

  const view = resolveView(searchParams.get('vista'), viewAll)
  const reference = parseDateParam(searchParams.get('fecha'), today)
  const days = searchParams.get('rango') === '30' ? 30 : 7
  const includeCancelled = searchParams.get('canceladas') === '1'
  const professionalParam = Number(searchParams.get('profesional'))
  const professional =
    viewAll && view !== 'dia' && Number.isInteger(professionalParam) && professionalParam > 0
      ? professionalParam
      : undefined

  const updateParams = (changes: Record<string, string | undefined>) =>
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current)
        for (const [key, value] of Object.entries(changes)) {
          if (value) next.set(key, value)
          else next.delete(key)
        }
        return next
      },
      { replace: true },
    )

  const move = (amount: number) =>
    updateParams({ fecha: format((view === 'dia' ? addDays : addWeeks)(reference, amount), DATE_FORMAT) })

  return { view, reference, days, includeCancelled, professional, updateParams, move }
}
