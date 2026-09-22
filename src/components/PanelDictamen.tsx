import { useState } from 'react'
import { AnimatePresence, m } from 'motion/react'
import {
  IconArrowsExchange,
  IconChevronDown,
  IconCircleCheck,
  IconProgressCheck,
} from '@tabler/icons-react'
import { criteriosFueraDeLey, NOMBRE_CRITERIO } from '../domain/reglas'
import { DescargarDictamen } from './DescargarDictamen'
import { EmblemasDe } from './EtiquetaPartido'
import type { ResultadoRegla } from '../domain/types'
import { relevo } from '../lib/animacion'
import { useDictamen } from '../store/dictamen'
import { Badge } from './ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible'
import { cn } from '../lib/utils'

function Icono({ resultado }: { resultado: ResultadoRegla }) {
  if (resultado.cumple) {
    return <IconCircleCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
  }
  // El icono nombra el remedio, no la falta: hay que cambiar una fórmula por
  // otra. Un triángulo de advertencia decía «infracción» sin escribirlo.
  if (resultado.gravedad === 'sustitucion') {
    return <IconArrowsExchange className="text-destructive mt-0.5 size-4 shrink-0" aria-hidden />
  }
  return <IconProgressCheck className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />
}

/**
 * Llave del icono: cambia solo cuando cambia el dictamen de la regla.
 *
 * Es lo que hace que el relevo se dispare al resolverse un requisito y no en
 * cada redibujado. Sin ella el panel parpadearía entero al mover una ficha.
 */
function claveDeEstado(resultado: ResultadoRegla): string {
  return resultado.cumple ? 'cumple' : (resultado.gravedad ?? 'por-completar')
}

/**
 * Cómo se nombra el incumplimiento.
 *
 * Los dos son subsanables —el artículo 58.1.V de los Lineamientos prevé la etapa
 * de requerimiento y cumplimiento, y el 64 la desarrolla para paridad y medidas
 * compensatorias—, así que lo que la insignia distingue
 * no es la gravedad sino la **vía**: completar lo que falta, o reemplazar lo que
 * ya está puesto.
 */
function estado(resultado: ResultadoRegla): string {
  return resultado.gravedad === 'sustitucion' ? 'Requiere sustitución' : 'Por completar'
}

/** Resumen de la caja, con concordancia: «1 requiere» frente a «3 requieren». */
function resumen(sustituciones: number, porCompletar: number): string {
  const partes: string[] = []
  if (sustituciones > 0) {
    partes.push(`${sustituciones} ${sustituciones === 1 ? 'requiere' : 'requieren'} sustitución`)
  }
  if (porCompletar > 0) partes.push(`${porCompletar} por completar`)
  return partes.join(' · ')
}

function agrupar(resultados: readonly ResultadoRegla[]): [string, ResultadoRegla[]][] {
  const grupos = new Map<string, ResultadoRegla[]>()
  for (const resultado of resultados) {
    const existente = grupos.get(resultado.alcance)
    if (existente) existente.push(resultado)
    else grupos.set(resultado.alcance, [resultado])
  }
  return [...grupos.entries()]
}

/**
 * Lo que el pliegue de un ámbito recuerda.
 *
 * `cumplia` no es información redundante: es la memoria que permite distinguir
 * un **cambio** de cumplimiento de un estado sostenido. Sin ella no se podría
 * saber si este render es el primero en que el ámbito quedó completo —y toca
 * plegarlo— o el quinto seguido, en el que la persona ya lo desplegó a mano y
 * volver a plegarlo sería pelearse con ella.
 */
interface Pliegue {
  abierto: boolean
  cumplia: boolean
}

/**
 * Cabecera de un ámbito: el rótulo y, cuando está plegado, su estado.
 *
 * La insignia es la parte que hace seguro plegar. Un pliegue que oculta *que*
 * hay un problema sería una trampa; este oculta el detalle y deja el resumen a
 * la vista, así que la fila plegada sigue diciendo la verdad.
 */
function Cabecera({
  alcance,
  reglas,
  cumple,
}: {
  alcance: string
  reglas: readonly ResultadoRegla[]
  cumple: boolean
}) {
  const sustituciones = reglas.filter((r) => !r.cumple && r.gravedad === 'sustitucion').length
  const pendientes = reglas.filter((r) => !r.cumple).length

  return (
    <CollapsibleTrigger
      className="group hover:text-foreground focus-visible:ring-ring text-muted-foreground -mx-1 flex w-full items-center gap-1.5 rounded px-1 py-0.5 text-xs font-medium tracking-wide uppercase transition-colors outline-none focus-visible:ring-[3px]"
      aria-label={`${alcance}: ${cumple ? 'cumple todo' : `${pendientes} sin cumplir`}`}
    >
      <EmblemasDe partidos={reglas[0]?.partidos ?? []} tamano="sm" />
      <span className="min-w-0 truncate">{alcance}</span>
      <span className="ml-auto flex shrink-0 items-center gap-1.5">
        {cumple ? (
          <IconCircleCheck className="size-4 text-emerald-600" aria-hidden />
        ) : (
          <Badge variant={sustituciones > 0 ? 'destructive' : 'secondary'}>{pendientes}</Badge>
        )}
        {/*
          El disparador de Base UI recibe `data-panel-open` cuando está abierto,
          y no `data-closed`. Así que el galón parte girado y se endereza al
          abrir: al revés, la clase no habría coincidido nunca y el galón habría
          quedado quieto sin que nada lo delatara.
        */}
        <IconChevronDown
          className="size-3.5 -rotate-90 transition-transform group-data-panel-open:rotate-0"
          aria-hidden
        />
      </span>
    </CollapsibleTrigger>
  )
}

/**
 * Dictamen en vivo. Distingue lo irreparable de lo que todavía falta, porque un
 * tablero a medio llenar incumple casi todos los mínimos sin haber infringido
 * nada.
 */
export function PanelDictamen() {
  const dictamen = useDictamen()
  const [pliegues, setPliegues] = useState<Record<string, Pliegue>>({})
  if (!dictamen) return null
  const { resultados, sustituciones, porCompletar, cerrable, criterios } = dictamen
  const alterados = criteriosFueraDeLey(criterios)
  const grupos = agrupar(resultados)

  /*
    El pliegue sigue al cumplimiento, y solo en sus cambios.

    Se ajusta durante el render y no en un efecto, que es el patrón que React
    admite para sincronizar estado con lo que llega de fuera: así el ámbito se
    pliega en el mismo pintado en que su última regla queda cumplida, sin el
    fotograma de retraso que dejaría un `useEffect`. Es idempotente —después de
    ajustar, `cumplia` ya coincide con `cumple`— así que no se repite.

    Y solo actúa en la transición. Mientras el estado se sostiene, manda lo que
    la persona haya decidido a mano: puede desplegar uno que cumple para
    revisarlo, o plegar uno con pendientes para quitarse ruido, y no se lo
    volvemos a cambiar en el siguiente movimiento.
  */
  const siguiente = { ...pliegues }
  let ajustado = false
  for (const [alcance, reglas] of grupos) {
    const cumple = reglas.every((r) => r.cumple)
    const previo = pliegues[alcance]
    if (!previo || previo.cumplia !== cumple) {
      siguiente[alcance] = { abierto: !cumple, cumplia: cumple }
      ajustado = true
    }
  }
  if (ajustado) setPliegues(siguiente)

  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          Revisión preliminar
          {/*
            Un dictamen calculado con una lectura distinta a la de la ley tiene
            que decirlo en su propia cara: va a circular como captura de
            pantalla, sin la configuración que lo produjo al lado.
          */}
          {alterados.length > 0 && (
            <Badge
              variant="destructive"
              title={`Este dictamen no corre con la lectura de la ley en: ${alterados
                .map((clave) => NOMBRE_CRITERIO[clave])
                .join(', ')}.`}
            >
              {alterados.length === 1 ? 'Criterio alterado' : 'Criterios alterados'}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {cerrable
            ? 'La postulación satisface todas las reglas evaluadas.'
            : resumen(sustituciones.length, porCompletar.length)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/*
          Los ámbitos aparecen y desaparecen al repartir el convenio: una
          coalición que pasa a total pierde los tableros individuales. `layout`
          hace que los que quedan se acomoden en vez de saltar.
        */}
        <AnimatePresence initial={false}>
        {grupos.map(([alcance, delAlcance]) => {
          const cumple = delAlcance.every((r) => r.cumple)
          const abierto = siguiente[alcance]?.abierto ?? true
          return (
          <m.section
            key={alcance}
            layout="position"
            variants={relevo}
            initial="oculto"
            animate="visible"
            exit="saliente"
          >
            <Collapsible
              open={abierto}
              onOpenChange={(v) =>
                setPliegues((p) => ({ ...p, [alcance]: { abierto: v, cumplia: cumple } }))
              }
              className="space-y-1.5"
            >
            <Cabecera alcance={alcance} reglas={delAlcance} cumple={cumple} />
            {/*
              `--collapsible-panel-height` la publica Base UI en el propio panel,
              así que el alto se anima sin medirlo a mano ni fijar un máximo.
            */}
            <CollapsibleContent
              className={cn(
                'h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-200 ease-out',
                'data-closed:h-0',
              )}
            >
            <ul className="space-y-1.5">
              {delAlcance.map((resultado, i) => (
                <li key={`${resultado.regla}-${i}`} className="flex gap-2 text-sm">
                  <AnimatePresence mode="wait" initial={false}>
                    <m.span
                      key={claveDeEstado(resultado)}
                      variants={relevo}
                      initial="oculto"
                      animate="visible"
                      exit="saliente"
                      className="shrink-0"
                    >
                      <Icono resultado={resultado} />
                    </m.span>
                  </AnimatePresence>
                  <div className="min-w-0 space-y-0.5">
                    <p className="flex flex-wrap items-center gap-1.5 leading-tight font-medium">
                      {resultado.regla}
                      {!resultado.cumple && (
                        <Badge
                          variant={
                            resultado.gravedad === 'sustitucion' ? 'destructive' : 'secondary'
                          }
                        >
                          {estado(resultado)}
                        </Badge>
                      )}
                    </p>
                    <p className="text-muted-foreground text-xs leading-snug">
                      {resultado.mensaje}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            </CollapsibleContent>
            </Collapsible>
          </m.section>
          )
        })}
        </AnimatePresence>

        {/*
          El producto final vive al pie de la revisión, que es donde se sabe si
          la postulación cierra. No en configuración: esto no es una preferencia.
        */}
        <DescargarDictamen
          cerrable={cerrable}
          pendientes={sustituciones.length + porCompletar.length}
        />
      </CardContent>
    </Card>
  )
}
