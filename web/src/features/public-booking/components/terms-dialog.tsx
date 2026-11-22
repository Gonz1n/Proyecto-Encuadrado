import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

export function TermsDialog({ centerName, terms }: { centerName: string; terms: string }) {
  return (
    <Dialog>
      <DialogTrigger
        render={<Button type="button" variant="link" className="-mt-1 h-11 px-0 text-[var(--cp-granate)] underline underline-offset-4" />}
      >
        Ver términos
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Términos y condiciones</DialogTitle>
          <DialogDescription>{centerName}</DialogDescription>
        </DialogHeader>
        <p className="max-h-[60vh] overflow-y-auto text-sm leading-relaxed whitespace-pre-line text-pretty">
          {terms}
        </p>
      </DialogContent>
    </Dialog>
  )
}
