import { IconAlertTriangle } from '@tabler/icons-react'
import { useSimulador } from '../store/simulador'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'

/**
 * Efecto rebote: cuando una regla rechaza un movimiento, la fórmula vuelve a su
 * origen y este diálogo cita el fundamento. Nunca se rechaza en silencio.
 */
export function DialogoRebote() {
  const rechazo = useSimulador((s) => s.rechazo)
  const descartarRechazo = useSimulador((s) => s.descartarRechazo)

  return (
    <Dialog open={rechazo !== null} onOpenChange={(abierto) => !abierto && descartarRechazo()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconAlertTriangle className="text-destructive size-5 shrink-0" aria-hidden />
            Movimiento rechazado
          </DialogTitle>
          <DialogDescription>{rechazo?.regla}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <p>{rechazo?.mensaje}</p>
          <blockquote className="text-muted-foreground border-l-2 pl-3 text-xs leading-relaxed whitespace-pre-line">
            {rechazo?.fundamento_legal}
          </blockquote>
        </div>

        <DialogFooter>
          <Button onClick={descartarRechazo}>Entendido</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
