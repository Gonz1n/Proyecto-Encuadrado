import { ClipboardList, UserRound } from 'lucide-react'
import { useBookingFlow } from '../booking-context'
import { OptionButton } from '../option-button'
import type { BookingStart } from '../use-booking-state'

const OPTIONS: { value: BookingStart; label: string; description: string; icon: typeof UserRound }[] = [
  {
    value: 'service',
    label: 'Por servicio',
    description: 'Elige primero la atención que necesitas.',
    icon: ClipboardList,
  },
  {
    value: 'professional',
    label: 'Por profesional',
    description: 'Elige primero con quién quieres atenderte.',
    icon: UserRound,
  },
]

export function ChooseStartStep() {
  const { state } = useBookingFlow()
  return (
    <ul className="grid gap-3">
      {OPTIONS.map(({ value, label, description, icon: Icon }) => (
        <li key={value}>
          <OptionButton onClick={() => state.update({ by: value })}>
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <span className="flex flex-col">
              <span className="font-medium">{label}</span>
              <span className="text-sm text-muted-foreground">{description}</span>
            </span>
          </OptionButton>
        </li>
      ))}
    </ul>
  )
}
