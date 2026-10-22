import { useState } from 'react'
import { IconSettings } from '@tabler/icons-react'
import { CRITERIOS_LEY, NOMBRE_CRITERIO, type Criterios } from '../domain/reglas'
import { siglasDe } from '../domain/catalogo'
import type { Postulante } from '../domain/types'
import { MODO_DESARROLLO, useConfiguracion, type Opciones } from '../store/configuracion'
import { useSimulador } from '../store/simulador'
import { SelectorTamanoTexto } from './SelectorTamanoTexto'
import { ScrollArea } from './ui/scroll-area'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'

interface Opcion {
  clave: keyof Opciones
  titulo: string
  detalle: string
  /**
   * Por qué la opción no cambiaría nada en la postulación de ahora, si es el
   * caso. La casilla sigue habilitada: la persona puede estar a punto de cambiar
   * de postulante, y desactivarla sin explicación se leería como una falla.
   */
  inaplicable?: (postulante: Postulante | null) => string | null
}

const CATALOGO: Opcion[] = [
  {
    clave: 'mostrarRentabilidad',
    titulo: 'Mostrar el porcentaje de votación',
    detalle:
      'Añade a cada distrito de la Fase 2 el porcentaje del PEL 2023-2024 que sustenta su posición de rentabilidad.',
  },
  {
    clave: 'mostrarSiglado',
    titulo: 'Mostrar el siglado de cada distrito',
    detalle:
      'Marca cada distrito del convenio con las siglas del partido al que se atribuyó en la Fase 1. Solo aplica a Coalición y Candidatura Común.',
    inaplicable: (postulante) =>
      postulante && postulante.integrantes.length === 1
        ? `Sin efecto en esta postulación · ${siglasDe(postulante.integrantes[0])} compite de forma individual con los quince distritos.`
        : null,
  },
  {
    clave: 'mostrarEditorFormulas',
    titulo: 'Editar las fórmulas del tablero',
    detalle:
      'Abre una ventana sobre la fórmula para cambiar su género y su medida compensatoria.',
  },
  {
    clave: 'sonidos',
    titulo: 'Activar los sonidos de la interfaz',
    detalle:
      'Emite un sonido en el rechazo de un movimiento y en el cierre de la revisión preliminar.',
  },
  {
    clave: 'mostrarLlenadoRapido',
    titulo: 'Mostrar los controles de llenado rápido',
    detalle:
      'Añade sobre la bandeja cuatro botones: crear fórmulas al azar, crear las que faltan, distribuirlas en el tablero y vaciarlo.',
  },
]

interface Lectura<K extends keyof Criterios> {
  valor: Criterios[K]
  titulo: string
  detalle: string
}

interface Criterio<K extends keyof Criterios = keyof Criterios> {
  clave: K
  /** El artículo que se interpreta. Es lo que permite defender la elección. */
  articulo: string
  lecturas: Lectura<K>[]
}

/**
 * Las bifurcaciones donde el texto admite más de una lectura.
 *
 * Cada una nombra el artículo, porque quien elija tiene que poder decir ante un
 * tercero qué leyó y por qué. La lectura marcada como la de la ley es la que
 * corre en producción.
 */
const CRITERIOS: Criterio[] = [
  {
    clave: 'denominadorParidad',
    articulo: 'Artículo 20.2 de los Lineamientos',
    lecturas: [
      {
        valor: 'ambito',
        titulo: 'Cuenta todos los distritos del ámbito',
        detalle:
          'Fija el mínimo desde el primer movimiento. Cuenta también los distritos fuera del convenio en los que el partido podría no contender.',
      },
      {
        valor: 'registradas',
        titulo: 'Cuenta solo las candidaturas registradas',
        detalle:
          'Recoge las palabras del artículo: «sumando las candidaturas… más sus registros». Exige que las mujeres no sean menos que los hombres. El mínimo se mueve con cada fórmula que se coloca.',
      },
    ],
  },
  {
    clave: 'alcanceMenorVotacion',
    articulo: 'Artículo 28.2 de los Lineamientos',
    lecturas: [
      {
        valor: 'candidatura',
        titulo: 'Alcanza a cualquier mujer de la fórmula',
        detalle:
          'Recoge las palabras del artículo: «en ningún caso se podrán postular candidaturas del género femenino», sin distinguir el cargo. Cierra esas posiciones también a las fórmulas de hombre o persona no binaria con suplencia mujer.',
      },
      {
        valor: 'propietaria',
        titulo: 'Alcanza solo a quien encabeza la fórmula',
        detalle:
          'Se apoya en el artículo 21.1, que describe el daño como postular «de forma exclusiva de mujeres en los distritos de menor votación». La suplente no compite, sustituye. El artículo 53.1 autoriza propietario hombre con suplencia mujer.',
      },
    ],
  },
  {
    clave: 'aritmeticaImposible',
    articulo: 'Artículos 27.1.V, 28.2 y 28.5 de los Lineamientos',
    lecturas: [
      {
        valor: 'reportar',
        titulo: 'Reporta el incumplimiento',
        detalle:
          'Marca la regla como incumplida aunque ningún acomodo la resuelva. En los ámbitos de 5, 7, 8 y 11 distritos ninguna composición satisface las cuatro reglas a la vez.',
      },
      {
        valor: 'inaplicable',
        titulo: 'Tiene la regla por no exigible',
        detalle:
          'Se apoya en el «y en lo que resulte aplicable» del artículo 27, numeral 1, punto V. La regla sigue apareciendo en el dictamen con la explicación.',
      },
      {
        valor: 'blindajeProporcional',
        titulo: 'Gradúa la prohibición, no la regla',
        detalle:
          'Se apoya en el «en proporción al número de distritos que integre cada bloque» del mismo punto V. Aplica la prohibición del 28.2 con la mayor extensión que quepa sin dejar al ámbito sin composición posible. Solo se aparta de la lectura literal en los ámbitos de 5, 7, 8 y 11 distritos. Nunca cierra una posición que la lectura literal deje abierta.',
      },
    ],
  },
]

function esDeLey(criterio: Criterio, valor: string): boolean {
  return CRITERIOS_LEY[criterio.clave] === valor
}

export function ModalConfiguracion() {
  const [abierto, setAbierto] = useState(false)
  const opciones = useConfiguracion((c) => c.opciones)
  const establecer = useConfiguracion((c) => c.establecer)
  const postulante = useSimulador((s) => s.postulante)
  const criterios = useConfiguracion((c) => c.criterios)
  const elegirCriterio = useConfiguracion((c) => c.elegirCriterio)

  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Configuración"
        title="Configuración"
        onClick={() => setAbierto(true)}
      >
        <IconSettings />
      </Button>

      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent className="grid-rows-[auto_minmax(0,1fr)] overflow-hidden sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Configuración</DialogTitle>
            <DialogDescription>
              Guarda estas preferencias en este navegador. No guarda el escenario del tablero.
            </DialogDescription>
          </DialogHeader>

          {/*
            Solo el cuerpo se desplaza. El encabezado y el botón de cerrar se
            quedan donde están: si el título se fuera con el desplazamiento, en
            una pantalla corta se perdería de vista de qué es este diálogo.

            `-mr-4 pr-4` mete la barra en el hueco del relleno del diálogo en vez
            de estrechar el texto, y `pb-1` deja aire para que el foco del último
            control no quede pegado al borde recortado.
          */}
          <ScrollArea className="-mr-4 pr-4">
          <div className="space-y-4 pb-1">
          <section className="space-y-2">
            <header className="space-y-0.5">
              <h3 className="text-sm font-medium">Escalar el texto de la herramienta</h3>
              <p className="text-muted-foreground text-xs leading-snug">
                «Seguir al sistema» toma el tamaño configurado en el navegador. Las demás opciones
                lo escalan a partir de ahí.
              </p>
            </header>
            <SelectorTamanoTexto />
          </section>

          <ul className="space-y-2 border-t pt-4">
            {CATALOGO.map(({ clave, titulo, detalle, inaplicable }) => {
              const aviso = inaplicable?.(postulante) ?? null
              return (
                <li key={clave}>
                  <label className="hover:bg-muted flex cursor-pointer gap-3 rounded-md border p-3">
                    <input
                      type="checkbox"
                      className="accent-primary mt-0.5 size-4 shrink-0"
                      checked={opciones[clave]}
                      onChange={(e) => establecer(clave, e.target.checked)}
                    />
                    <span className="min-w-0 space-y-1">
                      <span className="block text-sm font-medium">{titulo}</span>
                      <span className="text-muted-foreground block text-xs leading-snug">
                        {detalle}
                      </span>
                      {aviso && (
                        <span className="text-foreground/70 block text-xs leading-snug font-medium">
                          {aviso}
                        </span>
                      )}
                    </span>
                  </label>
                </li>
              )
            })}
          </ul>

          {/*
            Solo en desarrollo. Estas opciones no cambian lo que se ve: cambian
            lo que el dictamen afirma que es legal, así que van separadas de las
            preferencias por algo más que un espacio en blanco.
          */}
          {MODO_DESARROLLO && (
            <section className="space-y-3 border-t pt-4">
              <header className="space-y-1">
                <h3 className="flex items-center gap-2 text-sm font-medium">
                  Criterios de interpretación
                  <Badge variant="secondary">Solo en desarrollo</Badge>
                </h3>
                <p className="text-muted-foreground text-xs leading-snug">
                  Estas lecturas <strong className="text-foreground">modifican el dictamen</strong>,
                  no la presentación. En producción el simulador corre siempre con la lectura de la
                  ley.
                </p>
              </header>

              {CRITERIOS.map((criterio) => (
                <fieldset key={criterio.clave} className="space-y-1.5 rounded-md border p-3">
                  <legend className="px-1 text-xs font-medium">
                    {NOMBRE_CRITERIO[criterio.clave]}
                  </legend>
                  <p className="text-muted-foreground text-[0.6875rem]">{criterio.articulo}</p>
                  {criterio.lecturas.map((lectura) => (
                    <label
                      key={String(lectura.valor)}
                      className="hover:bg-muted flex cursor-pointer gap-3 rounded-md p-2"
                    >
                      <input
                        type="radio"
                        name={criterio.clave}
                        className="accent-primary mt-0.5 size-4 shrink-0"
                        checked={criterios[criterio.clave] === lectura.valor}
                        onChange={() => elegirCriterio(criterio.clave, lectura.valor)}
                      />
                      <span className="min-w-0 space-y-1">
                        <span className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
                          {lectura.titulo}
                          {esDeLey(criterio, lectura.valor) && (
                            <Badge variant="outline">Lectura de la ley</Badge>
                          )}
                        </span>
                        <span className="text-muted-foreground block text-xs leading-snug">
                          {lectura.detalle}
                        </span>
                      </span>
                    </label>
                  ))}
                </fieldset>
              ))}
            </section>
          )}
          </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  )
}
