import { useRef, useState } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { IconArrowLeft, IconArrowRight, IconHelpCircle } from '@tabler/icons-react'
import { paso as variantePaso } from '../../lib/animacion'
import { cn } from '../../lib/utils'
import { useConfiguracion } from '../../store/configuracion'
import { Button } from '../ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../ui/dialog'
import { PASOS } from './pasos'

/** Los puntos del avance. Son también el atajo para saltar a un paso concreto. */
function Avance({ actual, ir }: { actual: number; ir: (i: number) => void }) {
  return (
    /*
      Navegación, no pestañas: no gobiernan paneles, así que `role="tablist"`
      prometería a un lector de pantalla una estructura que no existe. Lo que sí
      hay es un paso en curso, y eso es `aria-current`.
    */
    <nav className="flex items-center gap-1.5" aria-label="Pasos del recorrido">
      {PASOS.map((p, i) => (
        <button
          key={p.id}
          type="button"
          aria-current={i === actual ? 'step' : undefined}
          aria-label={`Paso ${i + 1} de ${PASOS.length}: ${p.titulo}`}
          onClick={() => ir(i)}
          className={cn(
            'focus-visible:ring-ring h-1.5 rounded-full transition-all outline-none focus-visible:ring-[3px]',
            i === actual ? 'bg-foreground w-5' : 'bg-muted-foreground/30 hover:bg-muted-foreground/60 w-1.5',
          )}
        />
      ))}
    </nav>
  )
}

/**
 * Recorrido guiado por la herramienta.
 *
 * Las muestras de cada paso son HTML compuesto con los mismos componentes que la
 * aplicación real, no capturas: heredan el tema sin que `SelectorTema` sepa que
 * el tutorial existe, y un cambio de estilo o de rótulo viaja solo. Y responden
 * al clic —las pestañas cambian, la fórmula se arrastra, el distrito se retira—
 * porque una muestra que parece viva y no responde enseña lo contrario de lo que
 * pretende. Nada de lo que ocurre aquí toca la simulación.
 *
 * Se abre sola la primera vez y desde el botón del encabezado siempre.
 */
export function Tutorial() {
  const marcarVisto = useConfiguracion((c) => c.marcarTutorialVisto)
  // La primera visita lo abre sola, y se decide al montar en vez de en un efecto:
  // un `setState` dentro de un efecto provoca un segundo render y el diálogo
  // aparecería un fotograma después de la aplicación, como si llegara tarde.
  const [abierto, setAbierto] = useState(() => !useConfiguracion.getState().tutorialVisto)
  const [i, setI] = useState(0)
  const [direccion, setDireccion] = useState(1)
  const contenido = useRef<HTMLDivElement>(null)

  function ir(destino: number) {
    if (destino < 0 || destino >= PASOS.length) return
    setDireccion(destino > i ? 1 : -1)
    setI(destino)
  }

  function cerrar() {
    setAbierto(false)
    marcarVisto()
  }

  const actual = PASOS[i]
  const ultimo = i === PASOS.length - 1

  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Cómo se usa el simulador"
        title="Cómo se usa el simulador"
        onClick={() => {
          setI(0)
          setDireccion(1)
          setAbierto(true)
        }}
      >
        <IconHelpCircle />
      </Button>

      <Dialog open={abierto} onOpenChange={(v) => (v ? setAbierto(true) : cerrar())}>
        <DialogContent
          className="sm:max-w-2xl"
          // Las flechas mueven entre pasos. `Escape` lo cierra el propio diálogo.
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') ir(i + 1)
            if (e.key === 'ArrowLeft') ir(i - 1)
          }}
        >
          <DialogTitle className="sr-only">Cómo se usa el simulador</DialogTitle>
          <DialogDescription className="sr-only">
            Recorrido de {PASOS.length} pasos por la herramienta.
          </DialogDescription>

          {/*
            El foco aterriza aquí en cada cambio de paso: sin esto, quien navega
            con teclado oye el mismo título del diálogo nueve veces y nunca el
            contenido nuevo.
          */}
          <div ref={contenido} tabIndex={-1} className="space-y-4 outline-none">
            <AnimatePresence mode="wait" custom={direccion} initial={false}>
              <m.div
                key={actual.id}
                custom={direccion}
                variants={variantePaso}
                initial="entra"
                animate="centro"
                className="space-y-4"
                onAnimationStart={() => contenido.current?.focus()}
              >
                <actual.Miniatura />
                <header className="space-y-1">
                  <h2 className="text-base font-semibold tracking-tight">{actual.titulo}</h2>
                  <p className="text-muted-foreground text-sm leading-snug">{actual.cuerpo}</p>
                </header>
              </m.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-between gap-4 border-t pt-4">
            <Avance actual={i} ir={ir} />
            <div className="flex items-center gap-2">
              {i > 0 && (
                <Button variant="ghost" size="sm" onClick={() => ir(i - 1)}>
                  <IconArrowLeft data-icon="inline-start" />
                  Anterior
                </Button>
              )}
              {ultimo ? (
                <Button size="sm" onClick={cerrar}>
                  Empezar
                </Button>
              ) : (
                <Button size="sm" onClick={() => ir(i + 1)}>
                  Siguiente
                  <IconArrowRight data-icon="inline-end" />
                </Button>
              )}
            </div>
          </div>

          {!ultimo && (
            <button
              type="button"
              onClick={cerrar}
              className="text-muted-foreground hover:text-foreground focus-visible:ring-ring mx-auto -mt-1 rounded text-xs underline-offset-4 outline-none hover:underline focus-visible:ring-[3px]"
            >
              Saltar el recorrido
            </button>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
