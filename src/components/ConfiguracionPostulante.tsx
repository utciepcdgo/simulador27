import { useState } from 'react'
import { IconArrowsJoin, IconUser, IconUsersGroup, type Icon } from '@tabler/icons-react'
import { nombreDe, ordenarPorRegistro, PARTIDOS, siglasDe, tieneHistorial } from '../domain/catalogo'
import { FUNDAMENTOS, sinDerechoACoalicion } from '../domain/reglas'
import type { IdPartido, Postulante } from '../domain/types'
import { cn } from '../lib/utils'
import { useSimulador } from '../store/simulador'
import { EmblemaPartido } from './EmblemaPartido'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { RadioGroup, RadioGroupItem } from './ui/radio-group'

type Modalidad = Postulante['modalidad']

/**
 * Las tres maneras de postular, cada una con un icono que dice qué es.
 *
 * Las dos alianzas agrupan partidos, así que los dos iconos tienen que leerse
 * como grupo y aun así no confundirse entre sí:
 *
 * - **Coalición** — un grupo que actúa como un solo bloque: un convenio, una
 *   plataforma, y los distritos repartidos —siglados— entre sus integrantes.
 * - **Candidatura común** — caminos distintos que llegan a la misma candidatura:
 *   cada partido conserva su identidad y postula a la misma fórmula.
 */
const MODALIDADES: readonly { valor: Modalidad; Icono: Icon }[] = [
  { valor: 'Individual', Icono: IconUser },
  { valor: 'Coalición', Icono: IconUsersGroup },
  { valor: 'Candidatura Común', Icono: IconArrowsJoin },
]

/**
 * Por qué no se puede crear este postulante, si es que no se puede.
 *
 * Las tres primeras son de forma y se explican solas. La cuarta es una
 * prohibición legal, y por eso lleva fundamento: quien se topa con ella tiene
 * que poder citar el artículo ante un tercero, igual que en el rebote.
 */
function invalidez(
  modalidad: Modalidad | null,
  integrantes: IdPartido[],
): { mensaje: string; fundamento?: string } | null {
  if (!modalidad) return { mensaje: 'Falta elegir un modo de postulación.' }
  if (integrantes.length === 0) {
    return {
      mensaje:
        modalidad === 'Individual'
          ? 'Falta elegir el partido que postula.'
          : `Faltan los partidos que integran la ${modalidad.toLowerCase()}.`,
    }
  }
  if (modalidad === 'Individual' && integrantes.length > 1) {
    return { mensaje: 'La modalidad Individual admite un solo partido.' }
  }
  if (modalidad !== 'Individual' && integrantes.length < 2) {
    return { mensaje: `La modalidad ${modalidad} requiere cuando menos dos partidos.` }
  }
  // Solo la coalición. El artículo 9.5 no menciona la candidatura común, y
  // cerrarla aquí impediría una postulación que la norma no prohíbe.
  if (modalidad === 'Coalición') {
    const vetados = sinDerechoACoalicion(integrantes)
    if (vetados.length > 0) {
      return {
        mensaje: `${vetados.map(siglasDe).join(' y ')} no puede suscribir convenio de coalición. La candidatura común y la postulación individual siguen disponibles.`,
        fundamento: FUNDAMENTOS.coalicionNuevoRegistro,
      }
    }
  }
  return null
}

/**
 * Quién postula. Es la primera decisión y no tiene valor por omisión: precargar
 * un partido sería una toma de postura, y en materia electoral cualquier señal
 * de preferencia se lee como tal.
 *
 * Cambiarlo rehace el tablero completo, porque al cambiar de postulante cambian
 * los porcentajes y con ellos las posiciones de rentabilidad y los bloques. Las
 * fórmulas ya creadas regresan a la bandeja en lugar de quedarse en distritos
 * que dejaron de significar lo mismo.
 */
export function ConfiguracionPostulante({
  enPopover = false,
  onAplicar,
}: {
  /** Sin marco propio: la superficie y la elevación las pone el popover. */
  enPopover?: boolean
  /** Se avisa al aplicar, para que quien lo hospeda pueda cerrarse. */
  onAplicar?: () => void
} = {}) {
  const postulante = useSimulador((s) => s.postulante)
  const configurar = useSimulador((s) => s.configurar)
  const [modalidad, setModalidad] = useState<Modalidad | null>(postulante?.modalidad ?? null)
  const [integrantes, setIntegrantes] = useState<IdPartido[]>([...(postulante?.integrantes ?? [])])

  const error = invalidez(modalidad, integrantes)
  const sinHistorial = integrantes.filter((p) => !tieneHistorial(p))
  const sinCambios =
    postulante !== null &&
    modalidad === postulante.modalidad &&
    integrantes.length === postulante.integrantes.length &&
    integrantes.every((p) => postulante.integrantes.includes(p))

  function alternar(partido: IdPartido, marcado: boolean) {
    setIntegrantes((previos) => {
      if (marcado) {
        // En Individual el partido nuevo sustituye al anterior: nunca hay dos.
        // En alianza se reordena al vuelo, para que lo que se ve mientras se
        // elige sea ya lo que quedará registrado.
        return modalidad === 'Individual'
          ? [partido]
          : ordenarPorRegistro([...previos, partido])
      }
      return previos.filter((p) => p !== partido)
    })
  }

  return (
    <Card
      className={cn(
        'gap-4',
        enPopover && 'bg-transparent shadow-none ring-0 [--card-spacing:--spacing(4)]',
      )}
    >
      <CardHeader>
        <CardTitle className="text-base">Postulante</CardTitle>
        <CardDescription>
          {postulante
            ? 'La competitividad se calcula sumando los porcentajes individuales del PEL 2023-2024 de cada integrante.'
            : 'Elige un modo de postulación y los partidos que participan para crear el tablero.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/*
          La misma gramática visual que la rejilla de partidos de abajo: la
          tarjeta entera es la opción, y el radio de Base UI sigue ahí, solo que
          oculto a la vista. Así las flechas del teclado recorren las tres
          opciones, el foco y los lectores de pantalla se comportan como en
          cualquier grupo de radios, y no hay que reimplementar nada.

          Sin valor por omisión, por la misma razón que el postulante: precargar
          una modalidad sería sugerir una.
        */}
        <RadioGroup
          aria-label="Modo de postulación"
          className="grid-cols-3 gap-1.5"
          value={modalidad}
          onValueChange={(valor) => {
            const nueva = valor as Modalidad
            setModalidad(nueva)
            if (nueva === 'Individual') setIntegrantes((p) => p.slice(0, 1))
          }}
        >
          {MODALIDADES.map(({ valor, Icono }) => {
            const elegida = modalidad === valor
            return (
              <label
                key={valor}
                className={cn(
                  'flex cursor-pointer flex-col items-center gap-1.5 rounded-md border p-2.5 text-center transition-colors',
                  'focus-within:ring-ring focus-within:ring-[3px]',
                  elegida ? 'border-primary bg-primary/5' : 'hover:bg-muted',
                )}
              >
                {/*
                  Oculto con un envoltorio y no con `sr-only` sobre el radio: el
                  componente trae `relative` y `size-4`, que van después en la
                  hoja de estilos y le ganarían, y el radio se vería entero.
                */}
                <span className="sr-only">
                  <RadioGroupItem value={valor} />
                </span>
                <Icono
                  aria-hidden
                  className={cn(
                    'size-5 transition-colors',
                    elegida ? 'text-primary' : 'text-muted-foreground',
                  )}
                />
                <span className="text-xs leading-tight font-medium text-balance">{valor}</span>
              </label>
            )
          })}
        </RadioGroup>

        {/*
          El emblema es la casilla. Debajo sigue habiendo un `input` de verdad,
          solo que oculto a la vista: así el teclado, el foco y los lectores de
          pantalla se comportan como con cualquier casilla, sin reimplementar
          nada. El emblema apagado en gris es el estado sin marcar.
        */}
        <fieldset className="grid grid-cols-3 gap-1.5" disabled={modalidad === null}>
          {PARTIDOS.map(({ id_partido, siglas }) => {
            const marcado = integrantes.includes(id_partido)
            return (
              <label
                key={id_partido}
                className={cn(
                  'flex cursor-pointer flex-col items-center gap-1 rounded-md border p-2 transition-colors',
                  'focus-within:ring-ring focus-within:ring-[3px]',
                  'has-disabled:cursor-not-allowed has-disabled:opacity-40',
                  marcado ? 'border-primary bg-primary/5' : 'hover:bg-muted',
                )}
              >
                <input
                  type="checkbox"
                  aria-label={`Incluir a ${siglas} en la postulación`}
                  className="sr-only"
                  checked={marcado}
                  onChange={(e) => alternar(id_partido, e.target.checked)}
                />
                <EmblemaPartido
                  partido={id_partido}
                  className={cn(
                    'h-10 w-full transition-all',
                    !marcado && 'opacity-45 grayscale',
                  )}
                />
                <span className="text-[0.625rem] leading-none font-medium">{siglas}</span>
              </label>
            )
          })}
        </fieldset>

        {sinHistorial.length > 0 && (
          <p className="text-xs text-amber-700 dark:text-amber-500">
            {sinHistorial.map(nombreDe).join(', ')}{' '}
            {sinHistorial.length === 1 ? 'no compitió' : 'no compitieron'} en el PEL 2023-2024. Su
            porcentaje de votación queda sin dato, no en cero.
          </p>
        )}

        {error && (
          <div className="space-y-1.5">
            <p className="text-muted-foreground text-xs">{error.mensaje}</p>
            {error.fundamento && (
              <blockquote className="text-muted-foreground border-l-2 pl-3 text-xs leading-relaxed whitespace-pre-line">
                {error.fundamento}
              </blockquote>
            )}
          </div>
        )}

        <Button
          className="w-full"
          disabled={error !== null || sinCambios}
          onClick={() => {
            if (!modalidad) return
            configurar(integrantes, modalidad)
            onAplicar?.()
          }}
        >
          {postulante ? 'Aplicar y rehacer el tablero' : 'Crear el tablero'}
        </Button>
      </CardContent>
    </Card>
  )
}
