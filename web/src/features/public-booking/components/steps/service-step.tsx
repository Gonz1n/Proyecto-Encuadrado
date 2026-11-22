import { formatCLP, formatDuration } from '@/utils/format'
import { useBookingFlow } from '../../contexts/booking-context'
import { OptionButton } from '../option-button'

export function ServiceStep() {
  const { center, state } = useBookingFlow()
  if (center.services.length === 0) {
    return <p className="text-sm text-[var(--cp-granate)]/80">Este centro aún no publica servicios.</p>
  }
  return (
    <ul className="grid gap-2">
      {center.services.map((service) => (
        <li key={service.id}>
          <OptionButton aria-pressed={state.service?.id === service.id} onClick={() => state.update({ service: service.id })}>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="font-medium">{service.name}</span>
              <span className="text-sm text-[var(--cp-granate)]/80">{formatDuration(service.duration_minutes)}</span>
            </span>
            <span className="shrink-0 font-medium tabular-nums">{formatCLP(service.price_clp)}</span>
          </OptionButton>
        </li>
      ))}
    </ul>
  )
}
