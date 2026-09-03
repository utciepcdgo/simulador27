import { useState } from 'react'
import { IconSettings } from '@tabler/icons-react'
import { CRITERIOS_LEY, type Criterios } from '../domain/reglas'
import { siglasDe } from '../domain/catalogo'
import type { Postulante } from '../domain/types'
import { MODO_DESARROLLO, useConfiguracion, type Opciones } from '../store/configuracion'
import { useSimulador } from '../store/simulador'
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
    titulo: 'Mostrar rentabilidad',
    detalle:
      'Añade a cada distrito de la Fase 2 el porcentaje de votación del PEL 2023-2024 que sustenta su posición: la suma de la alianza en el tablero del convenio, y el porcentaje propio del partido en el suyo. Un partido de registro nuevo aparece con 0% en los quince distritos.',
  },
  {
    clave: 'mostrarSiglado',
    titulo: 'Mostrar siglado',
    detalle:
      'Marca cada distrito del tablero del convenio con las siglas del partido al que se le atribuyó en la Fase 1. Solo aplica a coalición y candidatura común, que es donde el siglado se negocia; los tableros de distritos fuera del convenio no lo llevan, porque ahí la pestaña ya dice de quién son.',
    inaplicable: (postulante) =>
      postulante && postulante.integrantes.length === 1
        ? `Sin efecto en esta postulación: ${siglasDe(postulante.integrantes[0])} compite de forma individual y los quince distritos son suyos.`
        : null,
  },
]

interface Lectura<K extends keyof Criterios> {
  valor: Criterios[K]
  titulo: string
  detalle: string
}

interface Criterio<K extends keyof Criterios = keyof Criterios> {
  clave: K
  titulo: string
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
    titulo: 'Universo de la paridad global',
    articulo: 'Artículo 20.2 de los Lineamientos',
    lecturas: [
      {
        valor: 'ambito',
        titulo: 'Todos los distritos del ámbito',
        detalle:
          'El mínimo se fija desde el primer movimiento y no se mueve. Cuenta también los distritos fuera del convenio en los que el partido podría no contender.',
      },
      {
        valor: 'registradas',
        titulo: 'Solo las candidaturas registradas',
        detalle:
          'Lo que dicen las palabras del artículo: «sumando las candidaturas… más sus registros». Equivale a exigir que las mujeres no sean menos que los hombres, y el mínimo se mueve mientras se arma el tablero.',
      },
    ],
  },
  {
    clave: 'aritmeticaImposible',
    titulo: 'Requisito imposible por la geometría del ámbito',
    articulo: 'Artículos 27.4, 28.2 y 28.5 de los Lineamientos',
    lecturas: [
      {
        valor: 'reportar',
        titulo: 'Se reporta como incumplimiento',
        detalle:
          'En ámbitos de 5 y 11 distritos, el 28.5 exige mayoría femenina en el bloque bajo y el 28.2 cierra las posiciones que harían falta. El motor lo reporta aunque ningún acomodo lo resuelva.',
      },
      {
        valor: 'inaplicable',
        titulo: 'No resulta aplicable',
        detalle:
          'Se apoya en el «y en lo que resulte aplicable» del 27.4. La regla sigue apareciendo en el dictamen con la explicación: no desaparece en silencio.',
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Configuración</DialogTitle>
            <DialogDescription>
              Estas preferencias se recuerdan en este navegador. El escenario que armes en el
              tablero no.
            </DialogDescription>
          </DialogHeader>

          <ul className="space-y-2">
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
                  ley y esta sección no existe.
                </p>
              </header>

              {CRITERIOS.map((criterio) => (
                <fieldset key={criterio.clave} className="space-y-1.5 rounded-md border p-3">
                  <legend className="px-1 text-xs font-medium">{criterio.titulo}</legend>
                  <p className="text-muted-foreground text-[11px]">{criterio.articulo}</p>
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
        </DialogContent>
      </Dialog>
    </>
  )
}
