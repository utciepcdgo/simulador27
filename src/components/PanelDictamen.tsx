import { AnimatePresence, m } from 'motion/react'
import { IconArrowsExchange, IconCircleCheck, IconProgressCheck } from '@tabler/icons-react'
import { criteriosFueraDeLey } from '../domain/reglas'
import type { ResultadoRegla } from '../domain/types'
import { relevo } from '../lib/animacion'
import { useDictamen } from '../store/dictamen'
import { Badge } from './ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'

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
 * Los dos son subsanables —el artículo 57.1.b de los Lineamientos prevé plazo
 * para subsanar los requisitos omitidos—, así que lo que la insignia distingue
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
 * Dictamen en vivo. Distingue lo irreparable de lo que todavía falta, porque un
 * tablero a medio llenar incumple casi todos los mínimos sin haber infringido
 * nada.
 */
export function PanelDictamen() {
  const dictamen = useDictamen()
  if (!dictamen) return null
  const { resultados, sustituciones, porCompletar, cerrable, criterios } = dictamen
  const alterados = criteriosFueraDeLey(criterios)

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
              title={`Criterio de interpretación fuera de su valor de origen: ${alterados.join(', ')}`}
            >
              Criterio alterado
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
        {agrupar(resultados).map(([alcance, delAlcance]) => (
          <m.section
            key={alcance}
            layout="position"
            variants={relevo}
            initial="oculto"
            animate="visible"
            exit="saliente"
            className="space-y-1.5"
          >
            <h3 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              {alcance}
            </h3>
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
          </m.section>
        ))}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
