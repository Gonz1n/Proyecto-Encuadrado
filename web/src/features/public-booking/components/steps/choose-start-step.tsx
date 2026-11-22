import { useBookingFlow } from '../../contexts/booking-context'
import { OptionButton } from '../option-button'
import { START_OPTIONS } from '../../constants/booking-flow'

export function ChooseStartStep() {
  const { state } = useBookingFlow()
  return (
    <ul className="grid gap-3">
      {START_OPTIONS.map(({ value, label, description, icon: Icon }) => (
        <li key={value}>
          <OptionButton onClick={() => state.update({ by: value })}>
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--cp-salmon)] text-[var(--cp-granate)]">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <span className="flex flex-col">
              <span className="font-medium">{label}</span>
              <span className="text-sm text-[var(--cp-granate)]/80">{description}</span>
            </span>
          </OptionButton>
        </li>
      ))}
    </ul>
  )
}
