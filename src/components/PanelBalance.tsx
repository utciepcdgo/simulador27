import { Fragment } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { recuentoDe, type ParidadDeAmbito, type RecuentoGrupo } from '../domain/reglas'
import { relevo } from '../lib/animacion'
import { EtiquetaPartido } from './EtiquetaPartido'
import { ROTULO_GRUPO } from '../lib/rotulos'
import { cn } from '../lib/utils'
import { useCriterios } from '../store/configuracion'
import { estadoDe, useSimulador } from '../store/simulador'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'

const COLOR_CELDA = {
  Mujer: 'bg-fuchsia-500',
  Hombre: 'bg-sky-500',
  Vacio: 'bg-muted',
} as const

type Celda = keyof typeof COLOR_CELDA

/** El corte del mínimo, dibujado entre dos celdas en vez de calculado en píxeles. */
function Umbral() {
  return <span className="bg-foreground/60 -my-1 w-0.5 shrink-0 rounded-full" aria-hidden />
}

/**
 * Una celda por candidatura del registro, ordenadas mujeres · hombres · vacías,
 * con el mínimo marcado.
 *
 * Celdas discretas y no una barra de proporción porque los distritos se cuentan,
 * no se miden: quince es un número pequeño y exacto, y lo que la persona necesita
 * saber de un vistazo es si el bloque de mujeres cruzó la marca. El orden es de
 * balance, no de tablero; el mapa está en la Fase 2.
 */
function TiraParidad({ fila }: { fila: ParidadDeAmbito }) {
  const repetir = (celda: Celda, veces: number) => Array<Celda>(veces).fill(celda)
  const celdas = [
    ...repetir('Mujer', fila.mujeres),
    ...repetir('Hombre', fila.hombres),
    ...repetir('Vacio', fila.sinAsignar),
  ]

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        {fila.partido !== null ? (
          <EtiquetaPartido partido={fila.partido} tamano="sm" className="font-medium" />
        ) : (
          <span className="font-medium">{fila.siglas}</span>
        )}
        <span className="text-muted-foreground tabular-nums">
          {fila.mujeres} de {fila.total} encabezadas por mujeres
          {/* En coalición total el integrante no tiene mínimo propio: el
              artículo 20.2 lo verifica sobre el conjunto. */}
          {fila.minimo === null ? ' · sin mínimo propio' : ` · mínimo ${fila.minimo}`}
        </span>
      </div>
      {celdas.length === 0 ? (
        <div className="text-muted-foreground rounded-sm border border-dashed py-1 text-center text-[0.625rem]">
          Sin distritos registrados
        </div>
      ) : (
        <div
          className="flex h-3 items-stretch gap-0.5"
          role="img"
          aria-label={`${fila.siglas}: ${fila.mujeres} fórmulas encabezadas por mujeres, ${fila.hombres} por hombres, ${fila.sinAsignar} sin asignar.${fila.minimo === null ? ' Sin mínimo propio.' : ` Mínimo ${fila.minimo}.`}`}
        >
          {celdas.map((celda, i) => (
            <Fragment key={i}>
              {i === fila.minimo && <Umbral />}
              <div className={cn('flex-1 rounded-[2px]', COLOR_CELDA[celda])} />
            </Fragment>
          ))}
          {fila.minimo !== null && fila.minimo >= celdas.length && <Umbral />}
        </div>
      )}
    </div>
  )
}

function FilaGrupo({ grupo }: { grupo: RecuentoGrupo }) {
  const vacio = grupo.candidaturas === 0
  return (
    <tr className={cn('border-t', vacio && 'text-muted-foreground/50')}>
      <th scope="row" className="py-1.5 pr-2 text-left font-normal">
        {ROTULO_GRUPO[grupo.grupo]}
      </th>
      <td className="text-muted-foreground py-1.5 text-right tabular-nums">{grupo.formulas}</td>
      <td className="text-muted-foreground py-1.5 text-right tabular-nums">
        {grupo.candidaturas}
      </td>
      <td
        className={cn(
          'py-1.5 text-right tabular-nums',
          grupo.sinAcreditar > 0 ? 'text-foreground font-medium' : 'text-muted-foreground/40',
        )}
      >
        {grupo.sinAcreditar > 0 ? grupo.sinAcreditar : '—'}
      </td>
    </tr>
  )
}

/**
 * Balance de la postulación: qué hay en el tablero, no si cumple.
 *
 * El dictamen contesta «¿ya cumplí?» y por eso se queda corto: una fórmula que
 * combina grupos no acredita ninguna cuota y desaparece de sus casillas, aunque
 * las dos personas existan y pertenezcan a un grupo en desventaja. Este panel
 * cuenta las dos cosas por separado para que esa diferencia se vea.
 */
export function PanelBalance() {
  const postulante = useSimulador((s) => s.postulante)
  const distritos = useSimulador((s) => s.distritos)
  const listasRP = useSimulador((s) => s.listasRP)
  const criterios = useCriterios()

  const estado = estadoDe({ postulante, distritos, listasRP })
  if (!estado) return null
  // El mismo universo que el dictamen: la tira no puede marcar un umbral
  // distinto del que la regla exige.
  const { mayoria, proporcional, paridad } = recuentoDe(estado, criterios)

  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle className="text-base">Balance de la postulación</CardTitle>
        <CardDescription>
          Una fórmula acredita una medida compensatoria solo cuando sus dos integrantes pertenecen
          a la misma. Las candidaturas se cuentan una por persona, acredite su fórmula o no.
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3">
          <h3 className="text-muted-foreground flex items-baseline justify-between text-[0.6875rem] font-medium tracking-wide uppercase">
            Quién encabeza la fórmula
            <span className="tabular-nums normal-case">
              {mayoria.formulas} fórmulas · {mayoria.candidaturas} candidaturas
            </span>
          </h3>

          {paridad.map((fila) => (
            <TiraParidad key={fila.ambito} fila={fila} />
          ))}

          <p className="text-muted-foreground text-xs">
            Entre las {mayoria.candidaturas} candidaturas de mayoría relativa hay{' '}
            <span className="text-foreground tabular-nums">{mayoria.personas.Mujer}</span> mujeres,{' '}
            <span className="text-foreground tabular-nums">{mayoria.personas.Hombre}</span> hombres
            y{' '}
            <span className="text-foreground tabular-nums">
              {mayoria.personas['No Binario']}
            </span>{' '}
            personas no binarias. Para la paridad, las personas que se autoadscriban como no
            binarias serán consideradas para ocupar los lugares que le correspondan al género
            masculino.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-muted-foreground text-[0.6875rem] font-medium tracking-wide uppercase">
            Grupos o sectores sociales en desventaja
          </h3>

          {/* La primera fórmula del tablero releva al texto de bienvenida. */}
          <AnimatePresence mode="wait" initial={false}>
          {mayoria.formulas === 0 ? (
            <m.p
              key="vacio"
              variants={relevo}
              initial="oculto"
              animate="visible"
              exit="saliente"
              className="text-muted-foreground rounded-md border border-dashed p-4 text-center text-xs"
            >
              Aún no hay fórmulas asignadas. Al colocarlas aparecerá cuántas acreditan cada medida
              compensatoria y cuántas personas pertenecen al grupo sin que su fórmula lo acredite.
            </m.p>
          ) : (
            <m.table
              key="tabla"
              variants={relevo}
              initial="oculto"
              animate="visible"
              exit="saliente"
              className="w-full text-sm"
            >
              <thead>
                <tr className="text-muted-foreground text-[0.6875rem] tracking-wide uppercase">
                  <th scope="col" className="pb-1 text-left font-medium">
                    Grupo o sector social
                  </th>
                  <th scope="col" className="pb-1 text-right font-medium">
                    Fórmulas
                  </th>
                  <th scope="col" className="pb-1 text-right font-medium">
                    Candidaturas
                  </th>
                  <th scope="col" className="pb-1 text-right font-medium">
                    Sin acreditar
                    <span className="text-muted-foreground/70 block text-[0.625rem] font-normal normal-case">
                      falta homogeneidad
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {mayoria.grupos.map((grupo) => (
                  <FilaGrupo key={grupo.grupo} grupo={grupo} />
                ))}
              </tbody>
            </m.table>
          )}
          </AnimatePresence>

          <p className="text-muted-foreground border-t pt-2 text-xs tabular-nums">
            Lista &ldquo;A&rdquo;: {proporcional.formulas} fórmulas · {proporcional.candidaturas}{' '}
            candidaturas · {proporcional.encabezan.Mujer} encabezadas por mujeres
          </p>
        </section>
      </CardContent>
    </Card>
  )
}
