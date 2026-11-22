import { ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import type { PublicProfessional } from './api'
import { professionalSubtitle } from './center-page'
import { ProfessionalAvatar } from './professional-avatar'

const REGISTRY_URL = 'https://rnpi.superdesalud.gob.cl/'

export function ProfessionalSubtitle({ professional }: { professional: PublicProfessional }) {
  const text = professionalSubtitle(professional)
  return text ? <span className="text-sm text-muted-foreground">{text}</span> : null
}

export function ProfessionalProfileDialog({ professional }: { professional: PublicProfessional }) {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="ghost" className="h-10 px-3" />}>Ver perfil</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="flex-row items-center gap-4 text-left">
          <ProfessionalAvatar professional={professional} className="size-14" />
          <div className="min-w-0">
            <DialogTitle>{professional.full_name}</DialogTitle>
            <DialogDescription>
              <ProfessionalSubtitle professional={professional} />
            </DialogDescription>
          </div>
        </DialogHeader>
        {professional.bio ? (
          <p className="text-sm leading-relaxed whitespace-pre-line text-pretty">{professional.bio}</p>
        ) : (
          <p className="text-sm text-muted-foreground">Este profesional aún no agrega una descripción.</p>
        )}
        {professional.health_registry ? (
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t pt-4 text-sm">
            <span className="text-muted-foreground">Registro Superintendencia de Salud:</span>
            <span className="font-medium tabular-nums">{professional.health_registry}</span>
            <a href={REGISTRY_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
              Verificar
              <ExternalLink className="size-3.5" aria-hidden="true" />
              <span className="sr-only">(se abre en una pestaña nueva)</span>
            </a>
          </p>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
