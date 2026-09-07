import type { ReactNode } from 'react'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { repartirConvenio } from '../domain/reglas'
import type { DistritoActivo } from '../domain/types'
import { cn } from '../lib/utils'
import { estadoDe, useSimulador, type DestinoSiglado } from '../store/simulador'
import {
  codigoDestino,
  FUERA_DEL_CONVENIO,
  idColumnaSiglado,
  idDistritoArrastrable,
  leerCodigoDestino,
  SIN_SIGLAR,
} from './arrastre'
import { EtiquetaPartido } from './EtiquetaPartido'
import { Badge } from './ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'

/**
 * Ficha cuadrada de un distrito.
 *
 * Cuadrado y no tira de ancho completo: el destino del arrastre es la columna de
 * un partido, y una ficha que ocupa todo el ancho obliga a un recorrido largo y
 * deja un blanco donde el cursor no agarra nada. El cuadrado se toma desde
 * cualquier borde.
 */
export function CajaDistrito({ distrito }: { distrito: DistritoActivo }) {
  return (
    <div
      className="bg-card flex aspect-square flex-col items-center justify-center gap-0.5 rounded-md border p-1 text-center shadow-xs"
      title={`Distrito ${distrito.numero_romano} · ${distrito.cabecera} · posición de rentabilidad ${distrito.posicion_rentabilidad} para la alianza`}
    >
      <span className="text-base leading-none font-semibold">{distrito.numero_romano}</span>
      <span className="text-muted-foreground w-full truncate text-[0.625rem] leading-tight">
        {distrito.cabecera}
      </span>
      <Badge variant="outline" className="mt-0.5">
        #{distrito.posicion_rentabilidad}
      </Badge>
    </div>
  )
}

function DistritoArrastrable({ distrito, activo }: { distrito: DistritoActivo; activo: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: idDistritoArrastrable(distrito.id_distrito),
    disabled: !activo,
  })
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(activo && 'cursor-grab', isDragging && 'opacity-40')}
    >
      <CajaDistrito distrito={distrito} />
    </div>
  )
}

function Columna({
  titulo,
  descripcion,
  destino,
  distritos,
  activo,
}: {
  titulo: ReactNode
  descripcion?: string
  destino: DestinoSiglado
  distritos: DistritoActivo[]
  activo: boolean
}) {
  const { setNodeRef, isOver } = useDroppable({ id: idColumnaSiglado(destino), disabled: !activo })
  return (
    <div className="min-w-0 space-y-1.5">
      <h3 className="flex items-center justify-between gap-2 text-sm font-medium">
        <span className="flex min-w-0 items-center gap-1 truncate">{titulo}</span>
        <Badge variant="secondary">{distritos.length}</Badge>
      </h3>
      {descripcion && <p className="text-muted-foreground text-xs">{descripcion}</p>}
      <div
        ref={setNodeRef}
        className={cn(
          // `content-start` evita que las fichas se estiren para rellenar la
          // altura mínima cuando hay pocas.
          'grid min-h-32 grid-cols-[repeat(auto-fill,minmax(5rem,1fr))] content-start gap-2 rounded-md border border-dashed p-2 transition-colors',
          isOver && 'border-primary bg-primary/5',
        )}
      >
        {distritos.length === 0 ? (
          <p className="text-muted-foreground col-span-full self-center py-6 text-center text-xs">
            Arrastra distritos aquí
          </p>
        ) : (
          distritos.map((distrito) => (
            <DistritoArrastrable key={distrito.id_distrito} distrito={distrito} activo={activo} />
          ))
        )}
      </div>
    </div>
  )
}

function ListaConSelects({ distritos }: { distritos: DistritoActivo[] }) {
  const siglar = useSimulador((s) => s.siglar)
  const integrantes = useSimulador((s) => s.postulante?.integrantes ?? [])
  // Los valores viajan como texto para que el `Select` no mezcle números con las
  // dos palabras clave; `leerCodigoDestino` los devuelve a su tipo.
  const opciones = [
    { label: 'Sin decidir', value: SIN_SIGLAR },
    ...integrantes.map((p) => ({
      label: (
        <span className="flex items-center gap-1.5">
          Convenio · <EtiquetaPartido partido={p} tamano="sm" />
        </span>
      ),
      value: codigoDestino(p),
    })),
    { label: 'Fuera del convenio', value: FUERA_DEL_CONVENIO },
  ]
  return (
    <ul className="space-y-1.5">
      {distritos.map((distrito) => (
        <li key={distrito.id_distrito} className="flex items-center gap-2">
          <span className="w-10 shrink-0 font-semibold">{distrito.numero_romano}</span>
          <span className="text-muted-foreground min-w-0 flex-1 truncate text-xs">
            {distrito.cabecera} · #{distrito.posicion_rentabilidad}
          </span>
          <Select
            items={opciones}
            value={
              distrito.postulacion.modo === 'convenio'
                ? codigoDestino(distrito.postulacion.partido)
                : distrito.postulacion.modo === 'fuera'
                  ? FUERA_DEL_CONVENIO
                  : SIN_SIGLAR
            }
            onValueChange={(valor) =>
              valor && siglar(distrito.id_distrito, leerCodigoDestino(valor))
            }
          >
            <SelectTrigger
              size="sm"
              className="w-44"
              aria-label={`Destino del Distrito ${distrito.numero_romano}`}
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
        </li>
      ))}
    </ul>
  )
}

/**
 * Fase 1 — Mesa de negociación.
 *
 * Cada distrito toma uno de tres caminos: se sigla a un partido dentro del
 * convenio, queda fuera de él —y entonces cada integrante lo postula por su
 * cuenta, con su propia competitividad— o sigue sin decidir. Cuántos abarque el
 * convenio es lo que lo hace total, parcial o flexible.
 */
export function FaseConvenio({ arrastre }: { arrastre: boolean }) {
  const distritos = useSimulador((s) => s.distritos)
  const postulante = useSimulador((s) => s.postulante)
  const listasRP = useSimulador((s) => s.listasRP)
  const estado = estadoDe({ postulante, distritos, listasRP })
  if (!estado || !postulante) return null
  const { integrantes, modalidad } = postulante

  if (integrantes.length === 1) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sin convenio que integrar</CardTitle>
          <CardDescription>
            <EtiquetaPartido partido={integrantes[0]} tamano="sm" className="align-text-bottom" />{' '}
            postula individualmente: los quince distritos le corresponden. El siglado solo se
            negocia en coalición o candidatura común.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const porOrden = [...distritos].sort((a, b) => a.posicion_rentabilidad - b.posicion_rentabilidad)
  const enModo = (modo: DistritoActivo['postulacion']['modo']) =>
    porOrden.filter((d) => d.postulacion.modo === modo)
  const reparticion = repartirConvenio(estado)

  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          Mesa de negociación
          {reparticion.sinDecidir === 0 && (
            <Badge variant={reparticion.clase === 'Insuficiente' ? 'destructive' : 'secondary'}>
              Coalición {reparticion.clase}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          <span className="inline-flex flex-wrap items-center gap-1.5 align-text-bottom">
            {modalidad}
            {integrantes.map((partido) => (
              <EtiquetaPartido key={partido} partido={partido} tamano="sm" />
            ))}
          </span>{' '}
          · el número es la posición de rentabilidad del distrito para la alianza. Lo que queda
          fuera del convenio lo postula cada partido por su cuenta, y al evaluarlo en la Fase 2
          cuenta su propia competitividad, no la suma.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {arrastre ? (
          <div className="space-y-4">
            <Columna
              titulo="Sin decidir"
              destino={SIN_SIGLAR}
              distritos={enModo('sin-decidir')}
              activo={arrastre}
            />
            <div
              className="grid gap-3"
              style={{ gridTemplateColumns: `repeat(${integrantes.length}, minmax(0, 1fr))` }}
            >
              {integrantes.map((partido) => (
                <Columna
                  key={partido}
                  titulo={
                    <>
                      Convenio · <EtiquetaPartido partido={partido} tamano="sm" />
                    </>
                  }
                  destino={partido}
                  distritos={porOrden.filter(
                    (d) => d.postulacion.modo === 'convenio' && d.postulacion.partido === partido,
                  )}
                  activo={arrastre}
                />
              ))}
            </div>
            <Columna
              titulo="Fuera del convenio"
              descripcion={`Cada integrante postula aquí por separado: ${integrantes.length} fórmulas por distrito.`}
              destino={FUERA_DEL_CONVENIO}
              distritos={enModo('fuera')}
              activo={arrastre}
            />
          </div>
        ) : (
          <ListaConSelects distritos={porOrden} />
        )}
      </CardContent>
    </Card>
  )
}
