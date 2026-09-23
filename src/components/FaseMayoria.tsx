import { useMemo } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { AnimatePresence, m } from 'motion/react'
import { IconArrowBackUp, IconFeather, IconLock, IconMapPinOff } from '@tabler/icons-react'
import { nombreDe, siglasDe } from '@/domain/catalogo'
import { ambitosDe, declinaPostular, type Ambito } from '@/domain/reglas'
import type { Bloque, DistritoActivo, DistritoEvaluado, IdPartido } from '../domain/types'
import { aparicion, ficha } from '../lib/animacion'
import { descripcion } from '../lib/formula'
import { cn } from '../lib/utils'
import { useConfiguracion, useCriterios } from '../store/configuracion'
import { tableroVigente, useNavegacion } from '../store/navegacion'
import { estadoDe, useSimulador } from '../store/simulador'
import { idCasillaMR } from './arrastre'
import { EmblemaPartido } from './EmblemaPartido'
import { BotonEditarFormula } from './EditorFormula'
import { EmblemasDe, EtiquetaPartido } from './EtiquetaPartido'
import { FormulaArrastrable } from './FichaFormula'
import { Badge } from './ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'

const BLOQUES: readonly Bloque[] = ['Alta', 'Media', 'Baja']

const COLOR_BLOQUE: Record<Bloque, string> = {
  Alta: 'bg-emerald-500',
  Media: 'bg-amber-500',
  Baja: 'bg-rose-500',
}

const SIN_FORMULA = 'sin-formula'

function SelectorFormula({
  distrito,
  partido,
}: {
  distrito: DistritoEvaluado
  partido: IdPartido | null
}) {
  const bandeja = useSimulador((s) => s.bandeja)
  const asignarMR = useSimulador((s) => s.asignarMR)
  const devolverABandeja = useSimulador((s) => s.devolverABandeja)
  const asignada = distrito.formula_asignada
  const disponibles = asignada ? [asignada, ...bandeja] : bandeja
  const opciones = [
    { label: 'Sin fórmula', value: SIN_FORMULA },
    ...disponibles.map((f) => ({ label: descripcion(f), value: f.id })),
  ]
  // Sin arrastre no hay ficha que pulsar: el lápiz es la única puerta al editor.
  return (
    <div className="flex items-center gap-1">
      <Select
        items={opciones}
        value={asignada?.id ?? SIN_FORMULA}
        onValueChange={(valor) => {
          if (!valor || valor === SIN_FORMULA) {
            if (asignada) devolverABandeja(asignada.id)
          } else {
            asignarMR(valor, distrito.id_distrito, partido)
          }
        }}
      >
        <SelectTrigger
          size="sm"
          className="w-full flex-1"
          aria-label={`Fórmula del Distrito ${distrito.numero_romano}`}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {opciones.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {asignada && <BotonEditarFormula formula={asignada} />}
    </div>
  )
}

function TarjetaDistrito({
  distrito,
  partido,
  arrastre,
  conSiglado,
  puedeRetirarse,
}: {
  distrito: DistritoEvaluado
  partido: IdPartido | null
  arrastre: boolean
  conSiglado: boolean
  /**
   * Si en este tablero se puede decidir no postular. Lo permiten el de quien
   * compite solo y los individuales de una coalición parcial o flexible; el del
   * convenio no, porque un distrito que la alianza no va a disputar sencillamente
   * no se sigla.
   */
  puedeRetirarse: boolean
}) {
  const devolverABandeja = useSimulador((s) => s.devolverABandeja)
  const alternarPostulacion = useSimulador((s) => s.alternarPostulacion)
  const alternarPostulacionIndividual = useSimulador((s) => s.alternarPostulacionIndividual)
  const mostrarRentabilidad = useConfiguracion((c) => c.opciones.mostrarRentabilidad)
  const { setNodeRef, isOver } = useDroppable({
    id: idCasillaMR(distrito.id_distrito, partido),
    disabled: !arrastre,
  })
  const blindada = distrito.esBlindada
  const asignada = distrito.formula_asignada

  return (
    <li className="bg-card space-y-1.5 rounded-md border p-2 shadow-xs">
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-semibold">{distrito.numero_romano}</span>
        {/*
          Va pegado al numeral y no al final de la fila: el siglado es de quién
          es el distrito, así que se lee junto con su identidad —«el quince, del
          PRI, Pueblo Nuevo»— y no junto a las cifras de rentabilidad. Además
          forma columna al bajar por el bloque, que es como se busca.
        */}
        {conSiglado && distrito.siglado !== null && (
          <Badge
            variant="outline"
            // `pl-1.5` es el mismo valor que la insignia se da a sí misma cuando
            // lleva un icono al inicio; el emblema va un punto más grande que un
            // glifo porque es una imagen y a 12 px se vuelve mancha.
            className="border-foreground/25 shrink-0 pl-1.5 font-semibold"
            title={`Siglado a ${nombreDe(distrito.siglado)}`}
          >
            <span className="sr-only">Siglado a </span>
            <EmblemaPartido
              partido={distrito.siglado}
              decorativo
              className="size-3.5 shrink-0 rounded-[2px]"
            />
            {siglasDe(distrito.siglado)}
          </Badge>
        )}
        <span className="text-muted-foreground min-w-0 flex-1 truncate text-xs">
          {distrito.cabecera}
        </span>
        {mostrarRentabilidad && distrito.porcentaje !== null && (
          <Badge
            variant="secondary"
            className="shrink-0 tabular-nums"
            title="Porcentaje de votación del PEL 2023-2024 que sustenta esta posición"
          >
            {distrito.porcentaje.toFixed(2)}%
          </Badge>
        )}
        {/*
          Sin bloques no hay posición de rentabilidad: el número sería el orden
          del distrito y leerlo como ranking de votación sería falso.
        */}
        {distrito.bloque !== null && (
          <Badge variant="outline" className="shrink-0">
            #{distrito.posicion_rentabilidad}
          </Badge>
        )}
        {puedeRetirarse && (
          <button
            type="button"
            onClick={() =>
              partido === null
                ? alternarPostulacion(distrito.id_distrito)
                : alternarPostulacionIndividual(distrito.id_distrito, partido)
            }
            aria-label={
              partido === null
                ? `No postular en el Distrito ${distrito.numero_romano}`
                : `${siglasDe(partido)} no postula en el Distrito ${distrito.numero_romano}`
            }
            title="No postular en este distrito. Los bloques se rehacen con los distritos restantes."
            className="text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring -mr-0.5 shrink-0 rounded p-1 transition-colors outline-none focus-visible:ring-[3px]"
          >
            <IconMapPinOff className="size-3.5" />
          </button>
        )}
      </div>

      {(blindada || distrito.mayoria_indigena) && (
        <div className="text-muted-foreground flex flex-wrap gap-2 text-[0.625rem]">
          {blindada && (
            <span
              className="flex items-center gap-0.5"
              title="Distrito de menor porcentaje de votación: no admite fórmulas encabezadas por mujeres."
            >
              <IconLock className="size-3" aria-hidden />
              Menor votación
            </span>
          )}
          {distrito.mayoria_indigena && (
            <span
              className="flex items-center gap-0.5"
              title="Distrito de mayor población indígena. Postular ahí una fórmula integrada por personas indígenas es optativo (artículo 55.1), no un requisito."
            >
              <IconFeather className="size-3" aria-hidden />
              Personas indígenas
            </span>
          )}
        </div>
      )}

      {arrastre ? (
        <div
          ref={setNodeRef}
          className={cn(
            'min-h-9 rounded border border-dashed p-1 transition-colors',
            isOver && 'border-primary bg-primary/5',
          )}
        >
          {asignada ? (
            <FormulaArrastrable
              formula={asignada}
              activo
              onQuitar={() => devolverABandeja(asignada.id)}
            />
          ) : (
            <p className="text-muted-foreground py-1 text-center text-[0.625rem]">Suelta una fórmula</p>
          )}
        </div>
      ) : (
        <SelectorFormula distrito={distrito} partido={partido} />
      )}
    </li>
  )
}

/**
 * Un tablero: los distritos de un ámbito repartidos en sus tres bloques.
 *
 * La posición de rentabilidad que muestra es la de *este* ámbito. El mismo
 * distrito fuera del convenio puede salir en el bloque Alta del tablero de un
 * partido y en el Baja del de otro, porque cada uno compite ahí con su propia
 * fuerza. No es una inconsistencia: es el artículo 28.8 en pantalla.
 */
/**
 * Los distritos que el partido dejó fuera de su postulación.
 *
 * Van al pie del tablero y no dentro de los bloques, porque el artículo 27
 * integra los bloques con los distritos donde **sí** se postula: uno retirado no
 * pertenece a ninguno. Se muestran para poder devolverlos, y en su orden de
 * distrito, no de rentabilidad —ya no tienen posición—.
 */
function SinPostular({
  distritos,
  partido,
}: {
  distritos: DistritoActivo[]
  /** El integrante que declinó, o `null` si la decisión es del tablero entero. */
  partido: IdPartido | null
}) {
  const alternarPostulacion = useSimulador((s) => s.alternarPostulacion)
  const alternarPostulacionIndividual = useSimulador((s) => s.alternarPostulacionIndividual)
  if (distritos.length === 0) return null
  return (
    <m.div
      variants={aparicion}
      initial="oculto"
      animate="visible"
      exit="saliente"
      className="mt-4 border-t pt-3"
    >
      <h3 className="text-muted-foreground mb-2 text-xs font-medium">
        No postula en {distritos.length} distrito(s)
      </h3>
      <ul className="flex flex-wrap gap-1.5">
        <AnimatePresence initial={false}>
          {distritos.map((distrito) => (
            <m.li key={distrito.id_distrito} layout="position" variants={ficha} initial="oculto" animate="visible" exit="saliente">
              <button
                type="button"
                onClick={() =>
                  partido === null
                    ? alternarPostulacion(distrito.id_distrito)
                    : alternarPostulacionIndividual(distrito.id_distrito, partido)
                }
                aria-label={`Volver a postular en el Distrito ${distrito.numero_romano}`}
                title="Devolver este distrito a la postulación"
                className="text-muted-foreground hover:border-foreground/30 hover:text-foreground focus-visible:ring-ring flex items-center gap-1 rounded-md border border-dashed px-2 py-1 text-xs transition-colors outline-none focus-visible:ring-[3px]"
              >
                <IconArrowBackUp className="size-3.5" aria-hidden />
                <span className="font-semibold">{distrito.numero_romano}</span>
                <span className="max-w-24 truncate">{distrito.cabecera}</span>
              </button>
            </m.li>
          ))}
        </AnimatePresence>
      </ul>
    </m.div>
  )
}

function Tablero({
  ambito,
  arrastre,
  integrantes,
  distritos,
}: {
  ambito: Ambito
  arrastre: boolean
  integrantes: readonly IdPartido[]
  /** El tablero completo del estado, para saber qué quedó fuera de este ámbito. */
  distritos: readonly DistritoActivo[]
}) {
  const partido = ambito.fuera ? ambito.partido : null
  const mostrarSiglado = useConfiguracion((c) => c.opciones.mostrarSiglado)
  // `partido === null` identifica exactamente al tablero del convenio de una
  // alianza: el individual trae su único partido, y los de fuera del convenio,
  // el suyo. Es la misma condición que pide la opción, sin repetirla.
  const conSiglado = mostrarSiglado && ambito.partido === null

  // Quién decidió no postular aquí. En un tablero individual es cosa de ese
  // partido; en el de quien compite solo, del distrito entero. En el convenio de
  // una alianza no hay tal decisión: lo que no se sigla queda fuera de él.
  const retirados = partido
    ? distritos.filter((d) => declinaPostular(d.postulacion, partido))
    : integrantes.length === 1
      ? distritos.filter((d) => d.postulacion.modo === 'sin-postular')
      : []
  const puedeRetirarse = partido !== null || integrantes.length === 1

  return (
    <Card className="gap-3">
      <CardHeader>
        <CardTitle className="flex min-w-0 items-center gap-2 text-base">
          {/* La etiqueta ya trae las siglas dentro, así que aquí va el emblema
              solo: repetirlas al lado sería tartamudear. */}
          <EmblemasDe
            partidos={ambito.partido !== null ? [ambito.partido] : integrantes}
            tamano="sm"
          />
          <span className="min-w-0 truncate">{ambito.etiqueta}</span>
        </CardTitle>
        <CardDescription>
          {ambito.distritos.length} de {ambito.distritos.length + retirados.length} distrito(s)
          {ambito.fuera
            ? ` · ranking propio de ${siglasDe(ambito.partido!)}, con su porcentaje individual`
            : ' · ranking de la postulación conjunta'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {ambito.distritos.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-xs">
            Todavía no hay distritos en este ámbito. Se reparten en la Fase 1.
          </p>
        ) : !ambito.conBloques ? (
          /*
            Sin bloques de competitividad el tablero no se reparte en tres: los
            quince distritos van en una sola lista, en orden ascendente de
            número. Partirlos en columnas sugeriría un ranking que no existe.
          */
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {[...ambito.distritos]
              .sort((a, b) => a.id_distrito - b.id_distrito)
              .map((distrito) => (
                <TarjetaDistrito
                  key={distrito.id_distrito}
                  distrito={distrito}
                  partido={partido}
                  arrastre={arrastre}
                  conSiglado={conSiglado}
                  puedeRetirarse={puedeRetirarse}
                />
              ))}
          </ul>
        ) : (
          <div className="grid gap-3 lg:grid-cols-3">
            {BLOQUES.map((bloque) => {
              const delBloque = ambito.distritos
                .filter((d) => d.bloque === bloque)
                .sort((a, b) => a.posicion_rentabilidad - b.posicion_rentabilidad)
              return (
                <section key={bloque} className="min-w-0 space-y-1.5">
                  <h3 className="flex items-center gap-2 text-sm font-medium">
                    <span
                      className={cn('size-2.5 rounded-full', COLOR_BLOQUE[bloque])}
                      aria-hidden
                    />
                    Bloque {bloque}
                    <Badge variant="secondary" className="ml-auto">
                      {delBloque.length}
                    </Badge>
                  </h3>
                  {delBloque.length === 0 ? (
                    <p className="text-muted-foreground rounded-md border border-dashed py-4 text-center text-[0.625rem]">
                      Sin distritos
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {delBloque.map((distrito) => (
                        <TarjetaDistrito
                          key={distrito.id_distrito}
                          distrito={distrito}
                          partido={partido}
                          arrastre={arrastre}
                          conSiglado={conSiglado}
                          puedeRetirarse={puedeRetirarse}
                        />
                      ))}
                    </ul>
                  )}
                </section>
              )
            })}
          </div>
        )}
        <SinPostular distritos={retirados} partido={partido} />
      </CardContent>
    </Card>
  )
}

/**
 * Rótulo de la pestaña, con la cuenta de distritos que la ley separa.
 *
 * Una pestaña es un nombre, no una oración: el ámbito completo —«PAN ·
 * postulaciones en lo individual»— lo dice el encabezado del tablero que se abre
 * debajo, así que aquí basta con distinguirlo del convenio.
 *
 * De qué partido es la pestaña es lo único que no puede encogerse. Todo lo que
 * identifica lleva `shrink-0` y el calificativo es lo que cede: en el peor de los
 * anchos se lee «PAN · indiv… 3», nunca «PA 3». Antes era al revés, porque el
 * `truncate` de las siglas era lo único elástico de la fila.
 */
function Rotulo({ ambito, enAlianza }: { ambito: Ambito; enAlianza: boolean }) {
  const cuenta = (
    <span className="text-muted-foreground shrink-0 tabular-nums">
      {ambito.distritos.length}
    </span>
  )
  if (!ambito.fuera && enAlianza) {
    return (
      <>
        <span className="shrink-0">Convenio</span>
        {cuenta}
      </>
    )
  }
  return (
    <>
      <EtiquetaPartido partido={ambito.partido!} tamano="sm" className="shrink-0" />
      {ambito.fuera && (
        <span className="text-muted-foreground min-w-0 truncate">· individual</span>
      )}
      {cuenta}
    </>
  )
}

/**
 * Fase 2 — Un tablero por ámbito de competitividad, en pestañas separadas: el
 * del convenio y, si la coalición es parcial o flexible, uno por integrante con
 * los distritos que postula por su cuenta.
 *
 * Separados y no apilados a propósito. Son universos que la ley prohíbe
 * acumular, y verlos como un continuo invitaría justo a lo que el artículo 28.8
 * impide: compensar con los distritos del convenio el desequilibrio de género de
 * los individuales.
 */
export function FaseMayoria({ arrastre }: { arrastre: boolean }) {
  const postulante = useSimulador((s) => s.postulante)
  const distritos = useSimulador((s) => s.distritos)
  const listasRP = useSimulador((s) => s.listasRP)
  const abierto = useNavegacion((n) => n.tablero)
  const abrirTablero = useNavegacion((n) => n.abrirTablero)

  const criterios = useCriterios()

  const tableros = useMemo(() => {
    const estado = estadoDe({ postulante, distritos, listasRP })
    return estado ? ambitosDe(estado, criterios).filter((a) => a.tipo === 'tablero') : []
  }, [postulante, distritos, listasRP, criterios])

  const seleccionado = tableroVigente(tableros, abierto)?.etiqueta

  if (tableros.length === 0) return null
  const integrantes = postulante?.integrantes ?? []
  if (tableros.length === 1) {
    return (
      <Tablero
        ambito={tableros[0]}
        arrastre={arrastre}
        integrantes={integrantes}
        distritos={distritos}
      />
    )
  }

  const enAlianza = integrantes.length > 1

  return (
    <Tabs value={seleccionado} onValueChange={(v) => abrirTablero(String(v))}>
      {/*
        `max-w-full` para que la fila se ajuste a la columna en vez de desbordarla,
        y `flex-initial` en cada pestaña para deshacer el reparto a partes iguales
        que hereda de la variante segmentada: aquí cada rótulo ocupa lo que mide y
        solo cede cuando de verdad no cabe la fila entera.
      */}
      <TabsList variant="line" className="max-w-full">
        {tableros.map((ambito) => (
          <TabsTrigger
            key={ambito.etiqueta}
            value={ambito.etiqueta}
            title={ambito.etiqueta}
            className="min-w-0 flex-initial"
          >
            <span className="flex min-w-0 items-center gap-1.5">
              <Rotulo ambito={ambito} enAlianza={enAlianza} />
            </span>
          </TabsTrigger>
        ))}
      </TabsList>
      {tableros.map((ambito) => (
        <TabsContent key={ambito.etiqueta} value={ambito.etiqueta} className="pt-2">
          <Tablero
            ambito={ambito}
            arrastre={arrastre}
            integrantes={integrantes}
            distritos={distritos}
          />
        </TabsContent>
      ))}
    </Tabs>
  )
}
