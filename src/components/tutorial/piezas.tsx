import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

/**
 * Piezas compartidas por las miniaturas del recorrido.
 *
 * Las miniaturas se arman con los mismos componentes que la herramienta real
 * —`Button`, `Badge`, `Card`, `Tabs`, `FichaFormula`— y no con marcado escrito a
 * mano: así un cambio de estilo o de rótulo viaja solo, y el tema tampoco tiene
 * que enterarse de que el tutorial existe. Lo que vive aquí es únicamente lo que
 * el recorrido necesita y la herramienta no tiene: el marco que aísla el ejemplo
 * y las etiquetas que señalan una parte.
 */

/**
 * El escenario de un paso.
 *
 * Fondo distinto del papel del diálogo para que se lea como una muestra y no
 * como un control vivo de la aplicación. Lo que hay dentro **sí** responde: el
 * motivo de renderizar HTML en vez de una captura es poder pulsarlo.
 */
export function Escenario({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'bg-muted/40 flex min-h-40 flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-5',
        className,
      )}
    >
      {children}
    </div>
  )
}

/** Rótulo que nombra una parte de la muestra sin competir con ella. */
export function Apunte({ children }: { children: ReactNode }) {
  return (
    <p className="text-muted-foreground max-w-md text-center text-xs leading-snug text-balance">
      {children}
    </p>
  )
}

/** Invitación a tocar la muestra. Solo donde la muestra de verdad responde. */
export function Pruebalo({ children }: { children: ReactNode }) {
  return (
    <p className="text-foreground/70 text-center text-[0.6875rem] font-medium tracking-wide uppercase">
      {children}
    </p>
  )
}
