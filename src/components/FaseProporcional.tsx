import { useDroppable } from '@dnd-kit/core'
import { siglasDe } from '../domain/catalogo'
import { ambitosRP, generoSubrepresentado } from '../domain/reglas'
import type { IdPartido, ListaRP } from '../domain/types'
import { cn } from '../lib/utils'
import { descripcion } from '../lib/formula'
import { estadoDe, useSimulador } from '../store/simulador'
import { idCasillaRP } from './arrastre'
import { FormulaArrastrable } from './FichaFormula'
import { Badge } from './ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'

const SIN_FORMULA = 'sin-formula'

function Casilla({
  partido,
  posicion,
  lista,
  arrastre,
}: {
  partido: IdPartido
  posicion: number
  lista: ListaRP
  arrastre: boolean
}) {
  const bandeja = useSimulador((s) => s.bandeja)
  const asignarRP = useSimulador((s) => s.asignarRP)
  const devolverABandeja = useSimulador((s) => s.devolverABandeja)
  const { setNodeRef, isOver } = useDroppable({
    id: idCasillaRP(partido, posicion),
    disabled: !arrastre,
  })
  const asignada = lista.posiciones[posicion - 1]
  const disponibles = asignada ? [asignada, ...bandeja] : bandeja
  const opciones = [
    { label: 'Sin fórmula', value: SIN_FORMULA },
    ...disponibles.map((f) => ({ label: descripcion(f), value: f.id })),
  ]

  return (
    <li className="flex items-center gap-2">
      <Badge variant={posicion <= 3 ? 'default' : 'secondary'} className="w-6 shrink-0">
        {posicion}
      </Badge>
      {arrastre ? (
        <div
          ref={setNodeRef}
          className={cn(
            'min-h-9 flex-1 rounded border border-dashed p-1 transition-colors',
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
        <Select
          items={opciones}
          value={asignada?.id ?? SIN_FORMULA}
          onValueChange={(valor) => {
            if (!valor || valor === SIN_FORMULA) {
              if (asignada) devolverABandeja(asignada.id)
            } else {
              asignarRP(valor, partido, posicion)
            }
          }}
        >
          <SelectTrigger
            size="sm"
            className="w-full flex-1"
            aria-label={`Fórmula de la posición ${posicion} de ${siglasDe(partido)}`}
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
      )}
    </li>
  )
}

/**
 * Fase 3 — Lista "A" de RP, una por partido. El encabezado compensatorio mira el
 * desempeño de MR de ese partido en concreto, no el de la alianza.
 */
export function FaseProporcional({ arrastre }: { arrastre: boolean }) {
  const postulante = useSimulador((s) => s.postulante)
  const listasRP = useSimulador((s) => s.listasRP)
  const distritos = useSimulador((s) => s.distritos)

  // El encabezado compensatorio mira el consolidado de MR del partido —dentro y
  // fuera del convenio—, que es el mismo que evalúa el motor.
  const estado = estadoDe({ postulante, distritos, listasRP })
  const ambitos = estado ? ambitosRP(estado) : []

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {listasRP.map((lista) => {
        const propios = ambitos.find((a) => a.partido === lista.partido)?.distritosMR ?? []
        const exigido = generoSubrepresentado(propios)
        return (
          <Card key={lista.partido} className="gap-3">
            <CardHeader>
              <CardTitle className="text-base">
                {siglasDe(lista.partido)} · Lista &ldquo;A&rdquo;
              </CardTitle>
              <CardDescription>
                {propios.length} distrito(s) de MR registrados.{' '}
                {exigido
                  ? `Debe encabezarla ${exigido === 'Mujer' ? 'una mujer' : 'un hombre'}.`
                  : 'MR en equivalencia: el encabezado es de libre determinación.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {lista.posiciones.map((_, i) => (
                  <Casilla
                    key={i}
                    partido={lista.partido}
                    posicion={i + 1}
                    lista={lista}
                    arrastre={arrastre}
                  />
                ))}
              </ul>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
