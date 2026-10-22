import { useEffect } from 'react'
import { IconAlertTriangle } from '@tabler/icons-react'
import { sonarError } from '../lib/sonido'
import { useConfiguracion } from '../store/configuracion'
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
  const conSonido = useConfiguracion((c) => c.opciones.sonidos)

  // Cada rechazo es un objeto nuevo, así que dos seguidos de la misma regla
  // suenan las dos veces. Es lo correcto: son dos intentos, no uno repintado.
  useEffect(() => {
    if (rechazo && conSonido) sonarError()
  }, [rechazo, conSonido])

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
          <Button onClick={descartarRechazo}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
