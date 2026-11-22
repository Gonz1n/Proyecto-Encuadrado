import Link from 'next/link'
import type { PublicCenter } from '@/features/center/types/public-center'
import { CARD_CLASS, PILL_CLASS } from '../../constants/styles'
import { professionalSubtitle } from '../../utils/center-page'
import { ProfessionalAvatar } from '../professional-avatar'
import { ProfessionalProfileDialog } from '../professional-profile-dialog'
import { SectionTitle } from './section-title'

export function ProfessionalsSection({ center, bookingPath }: { center: PublicCenter; bookingPath: string }) {
  return (
    <section id="profesionales" aria-labelledby="professionals-heading" className="space-y-6">
      <SectionTitle id="professionals-heading">Nuestros profesionales</SectionTitle>
      {center.professionals.length === 0 ? (
        <p className="text-sm">Este centro aún no tiene profesionales con agenda.</p>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {center.professionals.map((professional) => {
            const subtitle = professionalSubtitle(professional)
            return (
              <li key={professional.id} className={`${CARD_CLASS} flex flex-col items-center gap-3 p-5 text-center`}>
                <ProfessionalAvatar
                  professional={professional}
                  className="size-20 after:hidden"
                  fallbackClassName="bg-[var(--cp-salmon)] text-2xl font-semibold text-[var(--cp-granate)]"
                />
                <p className="text-lg font-bold [overflow-wrap:break-word]">{professional.full_name}</p>
                {subtitle ? <p className="text-sm">{subtitle}</p> : null}
                <hr className="w-full border-[var(--cp-terracota)]" />
                {professional.bio ? (
                  <p className="line-clamp-4 text-sm text-pretty">{professional.bio}</p>
                ) : null}
                <div className="mt-auto flex flex-wrap items-center justify-center gap-2 pt-2">
                  <ProfessionalProfileDialog professional={professional} />
                  <Link
                    href={`${bookingPath}?by=professional&professional=${professional.id}`}
                    aria-label={`Agendar con ${professional.full_name}`}
                    className={PILL_CLASS}
                  >
                    Agendar
                  </Link>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
