import { AnimatePresence, m } from 'motion/react'
import { useDroppable } from '@dnd-kit/core'
import { ficha } from '../lib/animacion'
import { useSimulador } from '../store/simulador'
import { ID_BANDEJA } from './arrastre'
import { CreadorFormulas } from './CreadorFormulas'
import { FormulaArrastrable } from './FichaFormula'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { cn } from '../lib/utils'

/**
 * Bandeja de fórmulas sin asignar. Es también el destino del efecto rebote: una
 * fórmula rechazada no se pierde, vuelve aquí.
 */
export function Bandeja({ arrastre }: { arrastre: boolean }) {
  const bandeja = useSimulador((s) => s.bandeja)
  const eliminarFormula = useSimulador((s) => s.eliminarFormula)
  const { setNodeRef, isOver } = useDroppable({ id: ID_BANDEJA, disabled: !arrastre })

  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle className="text-base">Fórmulas disponibles</CardTitle>
        <CardDescription>
          Pares anónimos de atributos jurídicos. El sistema no captura nombres.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <CreadorFormulas />
        <div
          ref={setNodeRef}
          className={cn(
            'min-h-24 space-y-1.5 rounded-md border border-dashed p-2 transition-colors',
            isOver && 'border-primary bg-primary/5',
          )}
        >
          {/*
            `popLayout` saca de flujo a la ficha que se va, para que las de abajo
            suban en vez de saltar. Es seguro con dnd-kit: la fuente del arrastre
            no lleva transformación propia —la pinta el `DragOverlay`—, así que
            no hay dos motores disputándose la misma matriz.
          */}
          <AnimatePresence mode="popLayout" initial={false}>
            {bandeja.length === 0 ? (
              <m.p
                key="vacia"
                variants={ficha}
                initial="oculto"
                animate="visible"
                exit="saliente"
                className="text-muted-foreground py-6 text-center text-xs"
              >
                Sin fórmulas disponibles
              </m.p>
            ) : (
              bandeja.map((formula) => (
                <m.div
                  key={formula.id}
                  layout="position"
                  variants={ficha}
                  initial="oculto"
                  animate="visible"
                  exit="saliente"
                >
                  <FormulaArrastrable
                    formula={formula}
                    activo={arrastre}
                    onQuitar={() => eliminarFormula(formula.id)}
                  />
                </m.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  )
}
