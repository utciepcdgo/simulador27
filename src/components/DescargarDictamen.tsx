import { useState } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { IconFileTypePdf, IconLoader2 } from '@tabler/icons-react'
import { revelado } from '../lib/animacion'
import { useCriterios } from '../store/configuracion'
import { estadoDe, useSimulador } from '../store/simulador'
import { Button } from './ui/button'

type Estado = { fase: 'quieto' | 'generando' } | { fase: 'fallo'; motivo: string }

/**
 * Genera el resultado de la simulación en PDF.
 *
 * La condición es que la postulación cierre: mientras quede una regla
 * incumplida no hay nada que documentar, y el botón lo dice en vez de
 * apagarse sin explicación.
 *
 * El módulo de impresión —la composición, las tipografías y `react-pdf` entero—
 * se importa aquí en diferido. Quien nunca genera el documento no paga su peso
 * al abrir la aplicación.
 */
export function DescargarDictamen({
  cerrable,
  pendientes,
  enDialogo = false,
}: {
  cerrable: boolean
  pendientes: number
  /** Sin marco propio: el filete y el aire los pone la caja que lo hospeda. */
  enDialogo?: boolean
}) {
  const postulante = useSimulador((s) => s.postulante)
  const distritos = useSimulador((s) => s.distritos)
  const listasRP = useSimulador((s) => s.listasRP)
  const criterios = useCriterios()
  const [estado, setEstado] = useState<Estado>({ fase: 'quieto' })

  async function generar() {
    const simulacion = estadoDe({ postulante, distritos, listasRP })
    if (!simulacion) return
    setEstado({ fase: 'generando' })
    try {
      const { descargarDictamen } = await import('../impresion')
      await descargarDictamen(simulacion, criterios)
      setEstado({ fase: 'quieto' })
    } catch (error) {
      // El motivo real, no un texto de consuelo. Un mensaje genérico obliga a
      // adivinar cuál de los recursos falló, y adivinar cuesta una vuelta entera.
      console.error('No se pudo componer el documento', error)
      setEstado({
        fase: 'fallo',
        motivo: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return (
    <div className={enDialogo ? 'space-y-2' : 'space-y-2 border-t pt-4'}>
      <Button
        className="w-full"
        disabled={!cerrable || estado.fase === 'generando'}
        onClick={generar}
      >
        {estado.fase === 'generando' ? (
          <IconLoader2 data-icon="inline-start" className="animate-spin" />
        ) : (
          <IconFileTypePdf data-icon="inline-start" />
        )}
        {estado.fase === 'generando'
          ? 'Componiendo el documento…'
          : 'Descargar el resultado en PDF'}
      </Button>

      <AnimatePresence initial={false} mode="wait">
        {!cerrable ? (
          <m.p
            key="pendiente"
            variants={revelado}
            initial="oculto"
            animate="visible"
            exit="saliente"
            className="text-muted-foreground overflow-hidden text-xs leading-snug"
          >
            El documento se emite cuando la postulación cumple todas las reglas. Falta
            {pendientes === 1 ? ' 1 requisito' : ` ${pendientes} requisitos`}.
          </m.p>
        ) : estado.fase === 'fallo' ? (
          <m.div
            key="fallo"
            variants={revelado}
            initial="oculto"
            animate="visible"
            exit="saliente"
            className="text-destructive overflow-hidden text-xs leading-snug"
            role="alert"
          >
            <p>No se pudo componer el documento.</p>
            <p className="mt-0.5 font-mono break-words opacity-80">{estado.motivo}</p>
          </m.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
