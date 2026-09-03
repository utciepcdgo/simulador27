import { useState } from 'react'
import { nombreDe, PARTIDOS, tieneHistorial } from '../domain/catalogo'
import type { IdPartido, Postulante } from '../domain/types'
import { cn } from '../lib/utils'
import { useSimulador } from '../store/simulador'
import { EmblemaPartido } from './EmblemaPartido'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'

type Modalidad = Postulante['modalidad']

const MODALIDADES: Modalidad[] = ['Individual', 'Coalición', 'Candidatura Común']

function invalidez(modalidad: Modalidad | null, integrantes: IdPartido[]): string | null {
  if (!modalidad) return 'Selecciona un modo de postulación.'
  if (integrantes.length === 0) {
    return modalidad === 'Individual'
      ? 'Selecciona el partido que postula.'
      : `Selecciona los partidos que integran la ${modalidad.toLowerCase()}.`
  }
  if (modalidad === 'Individual' && integrantes.length > 1) {
    return 'La modalidad Individual admite un solo partido.'
  }
  if (modalidad !== 'Individual' && integrantes.length < 2) {
    return `La modalidad ${modalidad} requiere cuando menos dos partidos.`
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
export function ConfiguracionPostulante() {
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
        return modalidad === 'Individual' ? [partido] : [...previos, partido]
      }
      return previos.filter((p) => p !== partido)
    })
  }

  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle className="text-base">Postulante</CardTitle>
        <CardDescription>
          {postulante
            ? 'La competitividad se calcula sumando los porcentajes individuales del PEL 2023-2024 de cada integrante.'
            : 'Elige un modo de postulación y los partidos que participan para armar el tablero.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Select
          items={MODALIDADES.map((m) => ({ label: m, value: m }))}
          value={modalidad}
          onValueChange={(valor) => {
            const nueva = valor as Modalidad | null
            setModalidad(nueva)
            if (nueva === 'Individual') setIntegrantes((p) => p.slice(0, 1))
          }}
        >
          <SelectTrigger className="w-full" aria-label="Modo de postulación">
            <SelectValue placeholder="Seleccione un modo" />
          </SelectTrigger>
          <SelectContent>
            {MODALIDADES.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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
                <span className="text-[10px] leading-none font-medium">{siglas}</span>
              </label>
            )
          })}
        </fieldset>

        {sinHistorial.length > 0 && (
          <p className="text-xs text-amber-700 dark:text-amber-500">
            {sinHistorial.map(nombreDe).join(', ')} no compitió en el PEL 2023-2024, así que su
            porcentaje es cero en los quince distritos y su competitividad propia queda sin
            criterio de orden.
          </p>
        )}

        {error && <p className="text-muted-foreground text-xs">{error}</p>}

        <Button
          className="w-full"
          disabled={error !== null || sinCambios}
          onClick={() => modalidad && configurar(integrantes, modalidad)}
        >
          {postulante ? 'Aplicar y rehacer el tablero' : 'Armar el tablero'}
        </Button>
      </CardContent>
    </Card>
  )
}
