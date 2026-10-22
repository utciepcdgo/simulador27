import { useState, type ReactNode } from 'react'
import { DndContext, PointerSensor, useDraggable, useDroppable, useSensor, useSensors } from '@dnd-kit/core'
import { AnimatePresence, m, useReducedMotion } from 'motion/react'
import {
  IconArrowBackUp,
  IconArrowsExchange,
  IconCircleCheck,
  IconFileTypePdf,
  IconMapPinOff,
  IconProgressCheck,
  IconSettings,
} from '@tabler/icons-react'
import { DISTRITOS, tamanosDeBloque } from '../../domain/catalogo'
import type { Bloque } from '../../domain/types'
import { RAPIDO, SUAVE } from '../../lib/animacion'
import { cuotasAcreditadas } from '../../lib/formula'
import { cn } from '../../lib/utils'
import { FichaFormula } from '../FichaFormula'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { formulaDemo } from './demo'
import { Apunte, Escenario, Pruebalo } from './piezas'

// ─── 1 · Qué es y qué nunca hace ─────────────────────────────────────────────

const ATRIBUTOS = ['Género', 'Edad', 'Medida compensatoria'] as const
const FORMULA_ANONIMA = formulaDemo('Mujer')

export function Anonimato() {
  return (
    <Escenario>
      <FichaFormula formula={FORMULA_ANONIMA} />
      <div className="flex flex-wrap justify-center gap-1.5">
        {ATRIBUTOS.map((atributo) => (
          <Badge key={atributo} variant="secondary">
            {atributo}
          </Badge>
        ))}
      </div>
      <Apunte>Eso es todo lo que define a una fórmula. No existe un campo de nombre.</Apunte>
    </Escenario>
  )
}

// ─── 2 · La fórmula como unidad ──────────────────────────────────────────────

const EJEMPLOS = [
  { rotulo: 'Dos mujeres jóvenes', formula: formulaDemo('Mujer', 'Mujer', { esJoven: true }) },
  {
    rotulo: 'Dos personas indígenas',
    formula: formulaDemo('Hombre', 'Hombre', { accionAfirmativa: 'Indígena' }),
  },
  {
    rotulo: 'Propietaria indígena, suplente sin adscripción',
    formula: (() => {
      const f = formulaDemo('Hombre', 'Hombre', { accionAfirmativa: 'Indígena' })
      return { ...f, suplente: { ...f.suplente, accionAfirmativa: 'Ninguna' as const } }
    })(),
  },
]

export function LaFormula() {
  const [i, setI] = useState(0)
  const { rotulo, formula } = EJEMPLOS[i]
  const cuotas = cuotasAcreditadas(formula)

  return (
    <Escenario>
      <FichaFormula formula={FORMULA_ARRASTRE} />
      <p className="text-xs font-medium">{rotulo}</p>
      <AnimatePresence mode="wait" initial={false}>
        <m.p
          key={cuotas.join()}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0, transition: RAPIDO }}
          exit={{ opacity: 0, transition: RAPIDO }}
          className="text-muted-foreground text-center text-xs"
        >
          {cuotas.length > 0 ? (
            <>
              Acredita <span className="text-foreground font-medium">{cuotas.join(' · ')}</span>
            </>
          ) : (
            'No acredita ninguna medida compensatoria'
          )}
        </m.p>
      </AnimatePresence>
      <Pruebalo>Cambiar el ejemplo</Pruebalo>
      <div className="flex gap-1.5">
        {EJEMPLOS.map((ejemplo, j) => (
          <Button
            key={ejemplo.rotulo}
            size="xs"
            variant={i === j ? 'default' : 'outline'}
            onClick={() => setI(j)}
            aria-label={ejemplo.rotulo}
          >
            {j + 1}
          </Button>
        ))}
      </div>
    </Escenario>
  )
}

// ─── 3 · Las tres fases ──────────────────────────────────────────────────────

const FASES = [
  { valor: 'convenio', rotulo: '1 · Convenio', dice: 'Con quién se postula y qué distrito es de quién.' },
  { valor: 'mayoria', rotulo: '2 · Mayoría relativa', dice: 'Los quince distritos, repartidos en tres bloques.' },
  { valor: 'proporcional', rotulo: '3 · Lista "A"', dice: 'Las cinco posiciones de representación proporcional.' },
]

export function Fases() {
  const [fase, setFase] = useState('convenio')
  return (
    <Escenario>
      <Tabs value={fase} onValueChange={(v) => setFase(String(v))} className="w-full">
        <TabsList variant="line" className="max-w-full">
          {FASES.map((f) => (
            <TabsTrigger key={f.valor} value={f.valor} className="min-w-0 flex-initial">
              {f.rotulo}
            </TabsTrigger>
          ))}
        </TabsList>
        {FASES.map((f) => (
          <TabsContent key={f.valor} value={f.valor} className="pt-3">
            <div className="bg-card flex min-h-16 items-center justify-center rounded-md border p-4 text-xs">
              {f.dice}
            </div>
          </TabsContent>
        ))}
      </Tabs>
      <Pruebalo>Cambiar de fase</Pruebalo>
    </Escenario>
  )
}

// ─── 4 · Arrastrar una fórmula al distrito ───────────────────────────────────

function FichaArrastrable({ id }: { id: string }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id })
  return (
    <div ref={setNodeRef} {...attributes} {...listeners} className="cursor-grab">
      <FichaFormula formula={FORMULA_ARRASTRE} arrastrando={isDragging} asidero />
    </div>
  )
}

function Casilla({
  id,
  romano,
  cabecera,
  cerrada,
  contenido,
}: {
  id: string
  romano: string
  cabecera: string
  cerrada?: boolean
  contenido: ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div className="bg-card min-w-0 flex-1 space-y-1.5 rounded-md border p-2">
      <p className="flex items-center gap-1.5 text-xs">
        <span className="font-semibold">{romano}</span>
        <span className="text-muted-foreground truncate">{cabecera}</span>
      </p>
      <div
        ref={setNodeRef}
        className={cn(
          'min-h-9 rounded border border-dashed p-1 transition-colors',
          isOver && 'border-primary bg-primary/5',
        )}
      >
        {contenido ?? (
          <p className="text-muted-foreground py-1 text-center text-[0.625rem]">
            {cerrada ? 'Posición de menor votación' : 'Soltar una fórmula'}
          </p>
        )}
      </div>
    </div>
  )
}

const FORMULA_ARRASTRE = formulaDemo('Mujer')

/**
 * El gesto central, con la regla que lo gobierna.
 *
 * El segundo distrito es de los de menor porcentaje de votación, donde el
 * artículo 28.2 no admite fórmulas encabezadas por mujeres. Soltar ahí produce
 * el mismo rebote que en la herramienta: la fórmula vuelve y se dice por qué.
 */
export function Arrastre() {
  const [colocada, setColocada] = useState<string | null>(null)
  const [rechazo, setRechazo] = useState(false)
  const sensores = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  return (
    <Escenario className="min-h-52">
      <DndContext
        sensors={sensores}
        onDragEnd={({ over }) => {
          if (!over) return
          if (over.id === 'cerrada') {
            setRechazo(true)
            return
          }
          setRechazo(false)
          setColocada(String(over.id))
        }}
      >
        <div className="flex w-full gap-2">
          <Casilla
            id="abierta"
            romano="IV"
            cabecera="Durango"
            contenido={colocada === 'abierta' ? <FichaFormula formula={FORMULA_ARRASTRE} /> : null}
          />
          <Casilla id="cerrada" romano="XIII" cabecera="Guanaceví" cerrada contenido={null} />
        </div>
        {!colocada && (
          <div className="mt-3 flex justify-center">
            <FichaArrastrable id="demo" />
          </div>
        )}
      </DndContext>

      <AnimatePresence initial={false}>
        {rechazo && (
          <m.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto', transition: SUAVE }}
            exit={{ opacity: 0, height: 0, transition: RAPIDO }}
            className="text-destructive overflow-hidden text-center text-xs leading-snug"
            role="alert"
          >
            Rechazada: los distritos de menor porcentaje de votación no admiten candidaturas
            de mujeres, ni como propietaria ni como suplente.
          </m.p>
        )}
      </AnimatePresence>
      {!colocada && <Pruebalo>Arrastrar la fórmula a un distrito</Pruebalo>}
    </Escenario>
  )
}

// ─── 5 · No postular en un distrito ──────────────────────────────────────────

const BLOQUES: readonly Bloque[] = ['Alta', 'Media', 'Baja']
const COLOR_BLOQUE: Record<Bloque, string> = {
  Alta: 'bg-emerald-500',
  Media: 'bg-amber-500',
  Baja: 'bg-rose-500',
}

/** Seis distritos reales del catálogo, suficientes para ver rehacerse los bloques. */
const MUESTRA = DISTRITOS.slice(0, 6)

export function NoPostular() {
  const [retirados, setRetirados] = useState<number[]>([])
  const activos = MUESTRA.filter((d) => !retirados.includes(d.id_distrito))
  const tamanos = tamanosDeBloque(activos.length)

  // Los bloques se rehacen con los que quedan: es el artículo 27 en pequeño.
  const inicio: Record<Bloque, number> = {
    Alta: 0,
    Media: tamanos.Alta,
    Baja: tamanos.Alta + tamanos.Media,
  }
  const porBloque = BLOQUES.map((bloque) => ({
    bloque,
    distritos: activos.slice(inicio[bloque], inicio[bloque] + tamanos[bloque]),
  }))

  return (
    <Escenario className="min-h-52">
      <div className="grid w-full grid-cols-3 gap-2">
        {porBloque.map(({ bloque, distritos }) => (
          <div key={bloque} className="min-w-0 space-y-1.5">
            <p className="flex items-center gap-1.5 text-[0.6875rem] font-medium">
              <span className={cn('size-2 rounded-full', COLOR_BLOQUE[bloque])} aria-hidden />
              {bloque}
              <Badge variant="secondary" className="ml-auto">
                {distritos.length}
              </Badge>
            </p>
            <AnimatePresence initial={false} mode="popLayout">
              {distritos.map((d) => (
                <m.div
                  key={d.id_distrito}
                  layout="position"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1, transition: RAPIDO }}
                  exit={{ opacity: 0, scale: 0.96, transition: RAPIDO }}
                  className="bg-card flex items-center gap-1 rounded-md border px-1.5 py-1"
                >
                  <span className="text-xs font-semibold">{d.numero_romano}</span>
                  <span className="text-muted-foreground min-w-0 flex-1 truncate text-[0.625rem]">
                    {d.cabecera}
                  </span>
                  <button
                    type="button"
                    onClick={() => setRetirados((r) => [...r, d.id_distrito])}
                    aria-label={`No postular en el Distrito ${d.numero_romano}`}
                    className="text-muted-foreground hover:bg-muted hover:text-foreground shrink-0 rounded p-0.5"
                  >
                    <IconMapPinOff className="size-3.5" />
                  </button>
                </m.div>
              ))}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {retirados.length > 0 && (
        <Button size="xs" variant="outline" onClick={() => setRetirados([])}>
          <IconArrowBackUp data-icon="inline-start" />
          Devolverlos a la postulación
        </Button>
      )}
      {retirados.length === 0 && <Pruebalo>Retirar un distrito</Pruebalo>}
    </Escenario>
  )
}

// ─── 6 · Configuración ───────────────────────────────────────────────────────

const AJUSTES = [
  'Mostrar el porcentaje de votación',
  'Mostrar el siglado de cada distrito',
  'Editar las fórmulas del tablero',
  'Mostrar los controles de llenado rápido',
]

export function Configuracion() {
  return (
    <Escenario>
      <Button variant="ghost" size="icon-sm" aria-label="Configuración" title="Configuración">
        <IconSettings />
      </Button>
      <ul className="text-muted-foreground max-w-sm space-y-1 text-xs">
        {AJUSTES.map((ajuste) => (
          <li key={ajuste} className="flex gap-2">
            <span className="bg-muted-foreground/50 mt-1.5 size-1 shrink-0 rounded-full" aria-hidden />
            {ajuste}
          </li>
        ))}
      </ul>
    </Escenario>
  )
}

// ─── 7 · Balance de la postulación ───────────────────────────────────────────

const TOTAL_DEMO = 15
const MINIMO_DEMO = 8

export function Balance() {
  const quieto = useReducedMotion()
  const [mujeres, setMujeres] = useState(quieto ? MINIMO_DEMO : 3)
  const cumple = mujeres >= MINIMO_DEMO

  return (
    <Escenario>
      <div className="w-full max-w-sm space-y-1.5">
        <div className="flex items-baseline justify-between gap-2 text-xs">
          <span className="font-medium">PAN</span>
          <span className="text-muted-foreground tabular-nums">
            {mujeres} de {TOTAL_DEMO} encabezadas por mujeres · mínimo {MINIMO_DEMO}
          </span>
        </div>
        <div className="flex h-3 items-stretch gap-0.5">
          {Array.from({ length: TOTAL_DEMO }, (_, i) => (
            <div key={i} className="contents">
              {i === MINIMO_DEMO && (
                <span className="bg-foreground/60 -my-1 w-0.5 shrink-0 rounded-full" aria-hidden />
              )}
              <m.div
                layout
                animate={{
                  backgroundColor: i < mujeres ? 'var(--color-fuchsia-500)' : 'var(--color-muted)',
                }}
                transition={quieto ? { duration: 0 } : SUAVE}
                className="flex-1 rounded-[2px]"
              />
            </div>
          ))}
        </div>
      </div>
      <p className={cn('text-xs font-medium', cumple ? 'text-emerald-600' : 'text-muted-foreground')}>
        {cumple ? 'Cruzó el mínimo' : 'Todavía por debajo del mínimo'}
      </p>
      <Pruebalo>Mover el conteo</Pruebalo>
      <div className="flex gap-1.5">
        <Button size="xs" variant="outline" onClick={() => setMujeres((n) => Math.max(0, n - 1))}>
          Una menos
        </Button>
        <Button size="xs" variant="outline" onClick={() => setMujeres((n) => Math.min(TOTAL_DEMO, n + 1))}>
          Una más
        </Button>
      </div>
    </Escenario>
  )
}

// ─── 8 · La revisión preliminar ──────────────────────────────────────────────

/** Rectángulos en lugar del texto de cada regla: aquí importa el estado, no el detalle. */
function Regla({ estado }: { estado: 'cumple' | 'sustitucion' | 'por-completar' }) {
  const Icono =
    estado === 'cumple' ? IconCircleCheck : estado === 'sustitucion' ? IconArrowsExchange : IconProgressCheck
  const color =
    estado === 'cumple'
      ? 'text-emerald-600'
      : estado === 'sustitucion'
        ? 'text-destructive'
        : 'text-amber-600'
  return (
    <li className="flex items-center gap-2">
      <AnimatePresence mode="wait" initial={false}>
        <m.span
          key={estado}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1, transition: RAPIDO }}
          exit={{ opacity: 0, scale: 0.9, transition: RAPIDO }}
        >
          <Icono className={cn('size-4 shrink-0', color)} aria-hidden />
        </m.span>
      </AnimatePresence>
      <span className="bg-muted-foreground/25 h-2 flex-1 rounded-full" aria-hidden />
    </li>
  )
}

const REGLAS_DEMO = ['cumple', 'cumple', 'sustitucion', 'por-completar', 'cumple'] as const

export function Revision() {
  const [todo, setTodo] = useState(false)
  return (
    <Escenario>
      <ul className="w-full max-w-xs space-y-2">
        {REGLAS_DEMO.map((estado, i) => (
          <Regla key={i} estado={todo ? 'cumple' : estado} />
        ))}
      </ul>
      <Pruebalo>{todo ? 'Todas cumplen' : 'Resolver lo pendiente'}</Pruebalo>
      <Button size="xs" variant="outline" onClick={() => setTodo((v) => !v)}>
        {todo ? 'Volver a lo pendiente' : 'Resolver todo'}
      </Button>
    </Escenario>
  )
}

// ─── 9 · Descargar el resultado en PDF ───────────────────────────────────────

export function Descarga() {
  const [listo, setListo] = useState(false)
  return (
    <Escenario>
      <div className="w-full max-w-xs space-y-2">
        <Button className="w-full" disabled={!listo}>
          <IconFileTypePdf data-icon="inline-start" />
          Descargar el resultado en PDF
        </Button>
        <AnimatePresence mode="wait" initial={false}>
          <m.p
            key={String(listo)}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0, transition: RAPIDO }}
            exit={{ opacity: 0, transition: RAPIDO }}
            className="text-muted-foreground text-center text-xs leading-snug"
          >
            {listo
              ? 'La postulación cumple todas las reglas: el documento ya se puede emitir.'
              : 'El documento se emite solo con todas las reglas cumplidas. Faltan 2 requisitos.'}
          </m.p>
        </AnimatePresence>
      </div>
      <Pruebalo>Probar los dos estados</Pruebalo>
      <Button size="xs" variant="outline" onClick={() => setListo((v) => !v)}>
        {listo ? 'Dejar requisitos pendientes' : 'Cumplir todas las reglas'}
      </Button>
    </Escenario>
  )
}
