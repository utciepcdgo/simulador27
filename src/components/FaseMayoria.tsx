import { useMemo, useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { IconFeather, IconLock } from '@tabler/icons-react'
import { nombreDe, siglasDe } from '../domain/catalogo'
import { ambitosDe, type Ambito } from '../domain/reglas'
import type { Bloque, DistritoEvaluado, IdPartido } from '../domain/types'
import { descripcion } from '../lib/formula'
import { cn } from '../lib/utils'
import { useConfiguracion } from '../store/configuracion'
import { estadoDe, useSimulador } from '../store/simulador'
import { idCasillaMR } from './arrastre'
import { EmblemaPartido } from './EmblemaPartido'
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
  return (
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
        className="w-full"
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
  )
}

function TarjetaDistrito({
  distrito,
  partido,
  arrastre,
  conSiglado,
}: {
  distrito: DistritoEvaluado
  partido: IdPartido | null
  arrastre: boolean
  conSiglado: boolean
}) {
  const devolverABandeja = useSimulador((s) => s.devolverABandeja)
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
        {mostrarRentabilidad && (
          <Badge
            variant="secondary"
            className="shrink-0 tabular-nums"
            title="Porcentaje de votación del PEL 2023-2024 que sustenta esta posición"
          >
            {distrito.porcentaje.toFixed(2)}%
          </Badge>
        )}
        <Badge variant="outline" className="shrink-0">
          #{distrito.posicion_rentabilidad}
        </Badge>
      </div>

      {(blindada || distrito.mayoria_indigena) && (
        <div className="text-muted-foreground flex flex-wrap gap-2 text-[10px]">
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
            <p className="text-muted-foreground py-1 text-center text-[10px]">Suelta una fórmula</p>
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
function Tablero({ ambito, arrastre }: { ambito: Ambito; arrastre: boolean }) {
  const partido = ambito.fuera ? ambito.partido : null
  const mostrarSiglado = useConfiguracion((c) => c.opciones.mostrarSiglado)
  // `partido === null` identifica exactamente al tablero del convenio de una
  // alianza: el individual trae su único partido, y los de fuera del convenio,
  // el suyo. Es la misma condición que pide la opción, sin repetirla.
  const conSiglado = mostrarSiglado && ambito.partido === null

  return (
    <Card className="gap-3">
      <CardHeader>
        <CardTitle className="text-base">{ambito.etiqueta}</CardTitle>
        <CardDescription>
          {ambito.distritos.length} distrito(s)
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
                    <p className="text-muted-foreground rounded-md border border-dashed py-4 text-center text-[10px]">
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
                        />
                      ))}
                    </ul>
                  )}
                </section>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/** Rótulo corto para la pestaña, con la cuenta de distritos que la ley separa. */
function rotulo(ambito: Ambito, enAlianza: boolean): string {
  const n = ambito.distritos.length
  if (ambito.fuera) return `${siglasDe(ambito.partido!)} en lo individual (${n})`
  return enAlianza ? `Convenio de coalición (${n})` : `${siglasDe(ambito.partido!)} (${n})`
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
  const [activo, setActivo] = useState<string | null>(null)

  const tableros = useMemo(() => {
    const estado = estadoDe({ postulante, distritos, listasRP })
    return estado ? ambitosDe(estado).filter((a) => a.tipo === 'tablero') : []
  }, [postulante, distritos, listasRP])

  // El conjunto de pestañas cambia al repartir el convenio: si la que estaba
  // abierta desaparece —la coalición pasó a total—, se vuelve a la primera.
  const seleccionado =
    activo && tableros.some((a) => a.etiqueta === activo) ? activo : tableros[0]?.etiqueta

  if (tableros.length === 0) return null
  if (tableros.length === 1) {
    return <Tablero ambito={tableros[0]} arrastre={arrastre} />
  }

  const enAlianza = (postulante?.integrantes.length ?? 1) > 1

  return (
    <Tabs value={seleccionado} onValueChange={(v) => setActivo(String(v))}>
      <TabsList variant="line">
        {tableros.map((ambito) => (
          <TabsTrigger key={ambito.etiqueta} value={ambito.etiqueta}>
            {rotulo(ambito, enAlianza)}
          </TabsTrigger>
        ))}
      </TabsList>
      {tableros.map((ambito) => (
        <TabsContent key={ambito.etiqueta} value={ambito.etiqueta} className="pt-2">
          <Tablero ambito={ambito} arrastre={arrastre} />
        </TabsContent>
      ))}
    </Tabs>
  )
}
