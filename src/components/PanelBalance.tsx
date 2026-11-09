import { Fragment } from 'react'
import { AnimatePresence, m } from 'motion/react'
import {
  POSICIONES_RP,
  recuentoDe,
  type ParidadDeAmbito,
  type Recuento,
  type RecuentoGrupo,
} from '../domain/reglas'
import { concuerda, plural } from '../domain/texto'
import { relevo } from '../lib/animacion'
import { EtiquetaPartido } from './EtiquetaPartido'
import { ROTULO_GRUPO } from '../lib/rotulos'
import { cn } from '../lib/utils'
import { useCriterios } from '../store/configuracion'
import { estadoDe, useSimulador } from '../store/simulador'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card'

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
          Encabezadas por mujeres: {fila.mujeres} de {fila.total}
          {/* En coalición total el integrante no tiene mínimo propio: el
              artículo 20.2 lo verifica sobre el conjunto. */}
          {fila.minimo === null ? ' · sin mínimo propio' : ` · mínimo ${fila.minimo}`}
        </span>
      </div>
      {celdas.length === 0 ? (
        <div className="text-muted-foreground rounded-sm border border-dashed py-1 text-center text-xs">
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
 * Las medidas compensatorias de un principio electivo.
 *
 * Se pinta una por principio y no una sola sumada, porque los universos no se
 * acumulan: el artículo 54.1 pide la fórmula de personas jóvenes en mayoría
 * relativa y el 55.1 pide una acción afirmativa entre los tres primeros lugares
 * de la Lista "A". Sumarlas daría un total que no satisface a ninguno de los
 * dos, y una lista que cumple podría leerse como incumplida por el arrastre de
 * la otra.
 */
function TablaGrupos({
  recuento,
  rotulo,
  vacio,
}: {
  recuento: Recuento
  /** El principio al que corresponde, que es lo que distingue una tabla de otra. */
  rotulo: string
  /** Qué decir cuando todavía no hay nada que contar. */
  vacio: string
}) {
  return (
    <section className="space-y-2">
      <h4 className="text-muted-foreground flex items-baseline justify-between gap-2 text-xs font-medium tracking-wide uppercase">
        {rotulo}
        <span className="tabular-nums normal-case">
          {plural(recuento.formulas, 'fórmula', 'fórmulas')} ·{' '}
          {plural(recuento.candidaturas, 'candidatura', 'candidaturas')}
        </span>
      </h4>

      {/* La primera fórmula releva al texto de bienvenida. */}
      <AnimatePresence mode="wait" initial={false}>
        {recuento.formulas === 0 ? (
          <m.p
            key="vacio"
            variants={relevo}
            initial="oculto"
            animate="visible"
            exit="saliente"
            className="text-muted-foreground rounded-md border border-dashed p-4 text-center text-xs"
          >
            {vacio}
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
              <tr className="text-muted-foreground text-xs tracking-wide uppercase">
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
                  <span className="text-muted-foreground/70 block text-xs font-normal normal-case">
                    falta homogeneidad
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {recuento.grupos.map((grupo) => (
                <FilaGrupo key={grupo.grupo} grupo={grupo} />
              ))}
            </tbody>
          </m.table>
        )}
      </AnimatePresence>
    </section>
  )
}

/** Las personas que postula un principio, por su género declarado. */
function PorGenero({ recuento, principio }: { recuento: Recuento; principio: string }) {
  return (
    <span className="block">
      Candidaturas de {principio}:{' '}
      <span className="text-foreground tabular-nums">{recuento.personas.Mujer}</span>{' '}
      {concuerda(recuento.personas.Mujer, 'mujer', 'mujeres')} ·{' '}
      <span className="text-foreground tabular-nums">{recuento.personas.Hombre}</span>{' '}
      {concuerda(recuento.personas.Hombre, 'hombre', 'hombres')} ·{' '}
      <span className="text-foreground tabular-nums">{recuento.personas['No Binario']}</span>{' '}
      {concuerda(recuento.personas['No Binario'], 'persona no binaria', 'personas no binarias')}
    </span>
  )
}

/**
 *  Balance de la postulación: qué hay en el tablero, no si cumple.
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

      {/*
        Una columna por principio electivo. Mayoría relativa y Lista "A" no se
        suman en ninguna de sus cuentas —ni en paridad, ni en medidas
        compensatorias—, y presentarlas juntas obligaba a adivinar qué parte de
        cada cifra venía de dónde.
      */}
      <CardContent className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3">
          <h3 className="flex items-baseline justify-between gap-2 text-sm font-medium">
            Mayoría relativa
            <span className="text-muted-foreground text-xs tabular-nums">
              {plural(mayoria.formulas, 'fórmula', 'fórmulas')}
            </span>
          </h3>

          {paridad.map((fila) => (
            <TiraParidad key={fila.ambito} fila={fila} />
          ))}

          <p className="text-muted-foreground space-y-1 text-sm">
            <PorGenero recuento={mayoria} principio="mayoría relativa" />
            {/* Artículo 53.4 de los Lineamientos. */}
            <span className="block">
              Para la paridad, las personas no binarias ocupan los lugares que corresponden al
              género masculino.
            </span>
          </p>

          <TablaGrupos
            recuento={mayoria}
            rotulo="Grupos o sectores sociales en desventaja"
            vacio="Aún no hay fórmulas asignadas en el tablero. Esta tabla cuenta cuántas acreditan cada medida compensatoria y cuántas personas pertenecen al grupo sin que su fórmula lo acredite."
          />
        </section>

        <section className="space-y-3">
          <h3 className="flex items-baseline justify-between gap-2 text-sm font-medium">
            Representación proporcional
            <span className="text-muted-foreground text-xs tabular-nums">
              {plural(proporcional.formulas, 'fórmula', 'fórmulas')}
            </span>
          </h3>

          <p className="text-muted-foreground space-y-1 text-sm">
            <span className="block">
              Lista &ldquo;A&rdquo;:{' '}
              <span className="text-foreground tabular-nums">
                {proporcional.encabezan.Mujer}
              </span>{' '}
              de {POSICIONES_RP}{' '}
              {concuerda(proporcional.encabezan.Mujer, 'posición encabezada', 'posiciones encabezadas')}{' '}
              por {concuerda(proporcional.encabezan.Mujer, 'mujer', 'mujeres')}
            </span>
            <PorGenero recuento={proporcional} principio="representación proporcional" />
            {/* Artículos 53.5 a 53.7: la lista alterna y su encabezado compensa
                el género subrepresentado en mayoría relativa. No hay un 50%
                contable que medir sobre cinco posiciones. */}
            <span className="block">
              La Lista &ldquo;A&rdquo; no se mide por porcentaje: alterna los géneros y la encabeza
              el subrepresentado en mayoría relativa.
            </span>
          </p>

          <TablaGrupos
            recuento={proporcional}
            rotulo="Grupos o sectores sociales en desventaja"
            vacio="Aún no hay fórmulas en la Lista «A». El artículo 55.1 pide cuando menos una acción afirmativa entre los tres primeros lugares."
          />
        </section>
      </CardContent>

      {/*
        La cláusula de cierre del articulado. Se escribe tal cual: no es un texto
        de interfaz que se pueda acortar ni reescribir, es una cláusula.

        Sin `border-t`: `CardFooter` solo dibuja separador si se le pide, y aquí
        basta el espacio. `text-base` es 1rem, 16 px, que son exactamente 12 pt a
        96 ppp; en `rem` y no en `pt` para que siga la escala de tamaño de texto
        de la configuración, que trabaja sobre la raíz.
      */}
      <CardFooter className="justify-center pt-2">
        <p className="text-muted-foreground text-center text-base text-balance">
          Lo no previsto será determinado por el Consejo General
        </p>
      </CardFooter>
    </Card>
  )
}
