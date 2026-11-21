import { useBookingFlow } from '../booking-context'
import { OptionButton } from '../option-button'
import { ProfessionalAvatar } from '../professional-avatar'
import { ProfessionalSubtitle } from '../professional-profile-dialog'

export function ProfessionalStep() {
  const { center, state } = useBookingFlow()
  if (center.professionals.length === 0) {
    return <p className="text-sm text-[var(--cp-granate)]/80">Este centro aún no tiene profesionales con agenda.</p>
  }
  return (
    <ul className="grid gap-2">
      {center.professionals.map((professional) => (
        <li key={professional.id}>
          <OptionButton
            aria-pressed={state.professional?.id === professional.id}
            onClick={() => state.update({ professional: professional.id })}
          >
            <ProfessionalAvatar professional={professional} className="size-10" />
            <span className="flex min-w-0 flex-col">
              <span className="font-medium">{professional.full_name}</span>
              <ProfessionalSubtitle professional={professional} />
            </span>
          </OptionButton>
        </li>
      ))}
    </ul>
  )
}
