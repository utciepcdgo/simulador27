import { useMemo, useState } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { IconArrowBackUp, IconDice5, IconLayoutGridAdd, IconStack2 } from '@tabler/icons-react'
import { ambitosDe } from '../domain/reglas'
import { aparicion } from '../lib/animacion'
import { tableroVigente, useNavegacion } from '../store/navegacion'
import { estadoDe, useSimulador } from '../store/simulador'
import { Button } from './ui/button'

/** Lo que el último control dejó dicho. */
interface Aviso {
  texto: string
  /** Requisitos que ningún acomodo satisface en este tablero. */
  irresolubles?: string[]
}

function plural(cuantas: number, singular: string, plural: string): string {
  return `${cuantas} ${cuantas === 1 ? singular : plural}`
}

/**
 * Atajos para plantear un escenario deprisa.
 *
 * Andamio de pruebas, no parte del procedimiento: van apagados de origen y se
 * encienden desde la configuración. Tres de los cuatro escriben sobre lo que ya
 * esté puesto, así que cada uno dice después qué hizo —cuántas fórmulas creó,
 * cuántos distritos llenó, qué no pudo resolver—. Un botón que actúa en silencio
 * sobre un tablero a medio negociar es un botón que da miedo pulsar.
 *
 * Actúan sobre el tablero abierto en la Fase 2, que es el que la persona está
 * viendo; por eso la pestaña activa vive en `useNavegacion` y no dentro del
 * componente que la pinta.
 */
export function ControlesLlenado({ fase }: { fase: string }) {
  const postulante = useSimulador((s) => s.postulante)
  const distritos = useSimulador((s) => s.distritos)
  const listasRP = useSimulador((s) => s.listasRP)
  const abierto = useNavegacion((n) => n.tablero)
  const crearAlAzar = useSimulador((s) => s.crearAlAzar)
  const crearNecesarias = useSimulador((s) => s.crearNecesarias)
  const distribuir = useSimulador((s) => s.distribuir)
  const vaciarTablero = useSimulador((s) => s.vaciarTablero)
  const [aviso, setAviso] = useState<Aviso | null>(null)

  const tablero = useMemo(() => {
    const estado = estadoDe({ postulante, distritos, listasRP })
    const tableros = estado ? ambitosDe(estado).filter((a) => a.tipo === 'tablero') : []
    return tableroVigente(tableros, abierto)
  }, [postulante, distritos, listasRP, abierto])

  const [cuantas, setCuantas] = useState(3)

  // En la Fase 3 la Lista "A" se ordena a mano: no hay bloques que repartir ni
  // casillas de mayoría relativa que vaciar. Los dos controles que actúan sobre
  // el tablero se deshabilitan y se dice por qué debajo: un botón apagado sin
  // explicación se lee como una falla, y su `title` no aparece porque un botón
  // deshabilitado no recibe el puntero.
  const enLista = fase === 'proporcional'

  return (
    <div className="bg-card space-y-2 rounded-xl border p-3 shadow-sm">
      <h2 className="text-muted-foreground text-xs font-medium">Llenado rápido</h2>

      <div className="flex gap-2">
        <input
          type="number"
          min={1}
          max={30}
          value={cuantas}
          onChange={(e) => setCuantas(Math.max(1, Math.min(30, Number(e.target.value) || 1)))}
          aria-label="Cuántas fórmulas crear al azar"
          className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-14 rounded-md border px-2 text-sm tabular-nums outline-none focus-visible:ring-3"
        />
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => {
            crearAlAzar(cuantas)
            setAviso({ texto: `${plural(cuantas, 'fórmula creada', 'fórmulas creadas')} al azar.` })
          }}
        >
          <IconDice5 data-icon="inline-start" />
          Crear al azar
        </Button>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="w-full justify-start"
        disabled={!tablero}
        onClick={() => {
          if (!tablero) return
          const creadas = crearNecesarias(tablero.etiqueta)
          setAviso({
            texto:
              creadas === 0
                ? 'La bandeja ya alcanza para llenar el tablero.'
                : `${plural(creadas, 'fórmula creada', 'fórmulas creadas')} para ${tablero.etiqueta}.`,
          })
        }}
      >
        <IconStack2 data-icon="inline-start" />
        Crear las que faltan
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="w-full justify-start"
        disabled={enLista || !tablero}
        onClick={() => {
          if (!tablero) return
          const { colocadas, irresolubles } = distribuir(tablero.etiqueta)
          setAviso({
            texto:
              colocadas === 0
                ? 'No quedan distritos vacíos, o no hay fórmulas del género que piden.'
                : `${plural(colocadas, 'distrito llenado', 'distritos llenados')}.`,
            irresolubles,
          })
        }}
      >
        <IconLayoutGridAdd data-icon="inline-start" />
        Distribuir en el tablero
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="w-full justify-start"
        disabled={enLista}
        onClick={() => {
          const devueltas = vaciarTablero()
          setAviso({
            texto:
              devueltas === 0
                ? 'El tablero ya estaba vacío.'
                : `${plural(devueltas, 'fórmula devuelta', 'fórmulas devueltas')} a la bandeja.`,
          })
        }}
      >
        <IconArrowBackUp data-icon="inline-start" />
        Vaciar el tablero
      </Button>

      {enLista && (
        <p className="text-muted-foreground text-xs leading-snug">
          Los dos últimos actúan sobre el tablero de la Fase 2. La Lista «A» se ordena a mano.
        </p>
      )}

      <AnimatePresence initial={false} mode="wait">
        {!enLista && aviso && (
          <m.p
            key={aviso.texto + aviso.irresolubles?.join()}
            variants={aparicion}
            initial="oculto"
            animate="visible"
            exit="saliente"
            className="text-muted-foreground text-xs leading-snug"
            role="status"
          >
            {aviso.texto}
            {aviso.irresolubles?.map((requisito) => (
              <span key={requisito} className="text-foreground/80 mt-1 block">
                Sin acomodo posible: {requisito.toLocaleLowerCase('es-MX')}. Se colocó el reparto
                más cercano.
              </span>
            ))}
          </m.p>
        )}
      </AnimatePresence>
    </div>
  )
}
