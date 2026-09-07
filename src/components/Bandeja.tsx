import { useState } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { useDroppable } from '@dnd-kit/core'
import { IconTrash } from '@tabler/icons-react'
import { ficha, relevo } from '../lib/animacion'
import { useSimulador } from '../store/simulador'
import { ID_BANDEJA } from './arrastre'
import { CreadorFormulas } from './CreadorFormulas'
import { FormulaArrastrable } from './FichaFormula'
import { Button } from './ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { cn } from '../lib/utils'

/**
 * Elimina de una vez las fórmulas que esperan en la bandeja.
 *
 * Confirma en su propio sitio en lugar de abrir un diálogo: la acción no
 * necesita interrumpir nada, solo un segundo pulso deliberado. Y no hay vuelta
 * atrás —estas fórmulas no se mueven, dejan de existir—, así que el botón que
 * confirma dice cuántas se lleva. Lo colocado en el tablero y en la Lista «A» no
 * se toca; para eso está el arrastre de vuelta.
 */
function VaciarBandeja({ cuantas }: { cuantas: number }) {
  const vaciarBandeja = useSimulador((s) => s.vaciarBandeja)
  const [confirmando, setConfirmando] = useState(false)
  const preguntando = confirmando && cuantas > 0

  return (
    <AnimatePresence mode="wait" initial={false}>
      {preguntando ? (
        <m.div
          key="confirmar"
          variants={relevo}
          initial="oculto"
          animate="visible"
          exit="saliente"
          className="flex items-center gap-1"
        >
          <Button
            size="xs"
            variant="destructive"
            onClick={() => {
              vaciarBandeja()
              setConfirmando(false)
            }}
          >
            Eliminar {cuantas}
          </Button>
          <Button size="xs" variant="ghost" onClick={() => setConfirmando(false)}>
            Cancelar
          </Button>
        </m.div>
      ) : (
        <m.div key="pedir" variants={relevo} initial="oculto" animate="visible" exit="saliente">
          <Button
            size="icon-sm"
            variant="ghost"
            disabled={cuantas === 0}
            onClick={() => setConfirmando(true)}
            aria-label="Eliminar las fórmulas de la bandeja"
            title="Eliminar las fórmulas que esperan en la bandeja. Las que ya están colocadas no se tocan."
            className="text-muted-foreground hover:text-destructive"
          >
            <IconTrash />
          </Button>
        </m.div>
      )}
    </AnimatePresence>
  )
}

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
        <CardAction>
          <VaciarBandeja cuantas={bandeja.length} />
        </CardAction>
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
