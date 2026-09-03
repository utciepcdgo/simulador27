import type { Bloque, Competitividad, DistritoActivo, IdPartido, Postulante } from '../types'
import { DISTRITOS } from './distritos'
import { PARTIDOS } from './partidos'
import { VOTACION } from './votacion'

export const TOTAL_DISTRITOS = 15

export const BLOQUES: readonly Bloque[] = ['Alta', 'Media', 'Baja']

/**
 * Integración parcial de bloques: cuántos distritos toca a cada bloque en un
 * ámbito de `total`.
 *
 * Los tres bloques son forzosos aunque el total no sea divisible entre tres, y
 * el excedente lo absorben los primeros. Siete distritos dan 3-2-2; ocho, 3-3-2;
 * los quince del ámbito completo, 5-5-5.
 */
export function tamanosDeBloque(total: number): Record<Bloque, number> {
  const base = Math.floor(total / 3)
  const excedente = total % 3
  return {
    Alta: base + (excedente > 0 ? 1 : 0),
    Media: base + (excedente > 1 ? 1 : 0),
    Baja: base,
  }
}

export function bloqueDePosicion(posicion: number, total: number = TOTAL_DISTRITOS): Bloque {
  const { Alta, Media } = tamanosDeBloque(total)
  if (posicion <= Alta) return 'Alta'
  if (posicion <= Alta + Media) return 'Media'
  return 'Baja'
}

/** Primera posición de cada bloque: las que mira el liderazgo de bloque. */
export function posicionesCabezaDeBloque(total: number): number[] {
  const { Alta, Media } = tamanosDeBloque(total)
  return [1, Alta + 1, Alta + Media + 1].filter((posicion) => posicion <= total)
}

/**
 * Posiciones blindadas frente a fórmulas encabezadas por mujeres: las dos de
 * menor votación **del bloque Bajo**.
 *
 * Las dos condiciones importan y ninguna sobra. Que sean relativas al ámbito y
 * no las 14 y 15 absolutas evita que el blindaje desaparezca en los tableros
 * parciales. Que estén dentro del bloque Bajo evita lo contrario, que es peor:
 * en un tablero de dos distritos el reparto es 1-1-0, y «las dos últimas del
 * ámbito» serían las posiciones 1 y 2 —bloque Alto y Medio—, con lo que el
 * blindaje acabaría prohibiendo mujeres en la zona más rentable.
 *
 * Cuando el bloque Bajo queda vacío el blindaje es matemáticamente inoperante y
 * el ámbito admite mujeres en cualquiera de sus posiciones.
 */
export function posicionesBlindadas(total: number): number[] {
  const { Alta, Media, Baja } = tamanosDeBloque(total)
  if (Baja === 0) return []
  // Artículo 28.7: cuando los bloques se integran por dos distritos cada uno
  // —el reparto 2-2-2, que solo ocurre con seis—, la prohibición alcanza
  // únicamente **el último distrito** del último bloque, no los dos. Es el
  // único tamaño parcial que el reglamento resuelve de forma expresa, y cerrar
  // ahí las dos posiciones dejaba al bloque bajo sin lugar para ninguna mujer:
  // el ámbito admitía como máximo dos fórmulas encabezadas por mujeres cuando el
  // piso del cincuenta por ciento pide tres, y por tanto no tenía solución.
  if (Alta === 2 && Media === 2 && Baja === 2) return [total]
  const primeraDeBaja = Alta + Media + 1
  const desde = Math.max(primeraDeBaja, total - 1)
  return Array.from({ length: total - desde + 1 }, (_, i) => desde + i)
}

export interface PorcentajeDistrital {
  id_distrito: number
  porcentaje: number
}

/** Evita que el ruido de punto flotante altere el orden al sumar porcentajes. */
function redondear(n: number): number {
  return Math.round(n * 1e4) / 1e4
}

const REGISTRADOS = new Set<number>(PARTIDOS.map((p) => p.id_partido))

/**
 * Porcentaje de votación que sustenta la competitividad del postulante en cada
 * distrito.
 *
 * Regla del Consejo General: siempre se parte del porcentaje **individual** del
 * PEL 2023-2024. Un partido que compite solo usa el suyo; una coalición o
 * candidatura común suma los de sus integrantes. Lo que cada partido hizo en
 * 2023-2024 (ir solo o aliado) no altera el cálculo, únicamente el fundamento
 * que se cita.
 *
 * `ids` acota el cálculo a un subconjunto de distritos, que es lo que necesita
 * un ámbito parcial: los que el convenio abarca, o los que un partido postula
 * por su cuenta.
 */
export function porcentajesDe(
  integrantes: readonly IdPartido[],
  ids?: readonly number[],
): PorcentajeDistrital[] {
  // Se parte de cero en cada distrito del alcance, no de lo que traiga la
  // votación: un partido de registro nuevo no compitió en 2023-2024 y su
  // porcentaje es cero, no «ausente». Sin esto, su tablero saldría vacío.
  const alcance = ids ?? DISTRITOS.map((d) => d.id_distrito)
  const acumulado = new Map<number, number>(alcance.map((id) => [id, 0]))
  for (const registro of VOTACION) {
    if (!integrantes.includes(registro.partido)) continue
    const previo = acumulado.get(registro.id_distrito)
    if (previo === undefined) continue
    acumulado.set(registro.id_distrito, previo + registro.porcentaje)
  }
  return [...acumulado.entries()].map(([id_distrito, suma]) => ({
    id_distrito,
    porcentaje: redondear(suma),
  }))
}

/** Si el partido compitió en el PEL 2023-2024 y por tanto tiene competitividad propia. */
export function tieneHistorial(partido: IdPartido): boolean {
  return VOTACION.some((registro) => registro.partido === partido)
}

/**
 * Aísla un conjunto de distritos, lo ordena de mayor a menor porcentaje y le
 * asigna posiciones de rentabilidad y bloques **propios**.
 *
 * Es el artículo 27: los distritos de un ámbito parcial no heredan la posición
 * que tenían en el ranking de quince, se vuelven a numerar entre ellos. Los
 * empates se desempatan por número de distrito ascendente, para que el resultado
 * sea reproducible.
 */
export function integrarBloques(
  porcentajes: readonly PorcentajeDistrital[],
): Competitividad[] {
  const ordenados = [...porcentajes].sort(
    (a, b) => b.porcentaje - a.porcentaje || a.id_distrito - b.id_distrito,
  )
  return ordenados.map(({ id_distrito, porcentaje }, i) => ({
    id_distrito,
    porcentaje,
    posicion_rentabilidad: i + 1,
    bloque: bloqueDePosicion(i + 1, ordenados.length),
  }))
}

/** Los quince distritos del postulante, ordenados y repartidos en bloques. */
export function competitividad(postulante: Postulante): Competitividad[] {
  const { integrantes } = postulante
  if (integrantes.length === 0) {
    throw new Error('Un postulante requiere al menos un partido integrante')
  }
  const duplicados = integrantes.length !== new Set(integrantes).size
  if (duplicados) {
    throw new Error(`Partidos repetidos en el postulante: ${integrantes.join(', ')}`)
  }
  for (const partido of integrantes) {
    if (!REGISTRADOS.has(partido)) {
      throw new Error(`Partido ${partido} ausente del registro`)
    }
  }
  if (integrantes.length === 1 && postulante.modalidad !== 'Individual') {
    throw new Error(`La modalidad "${postulante.modalidad}" requiere al menos dos partidos`)
  }
  if (integrantes.length > 1 && postulante.modalidad === 'Individual') {
    throw new Error('La modalidad "Individual" admite un solo partido')
  }

  return integrarBloques(porcentajesDe(integrantes))
}

/**
 * Tablero inicial: los 15 distritos con su competitividad y sin asignaciones.
 * Ordenado por posición de rentabilidad, que es el orden en que se presentan
 * los bloques en la interfaz.
 *
 * Un partido que compite solo no negocia convenio: sus quince distritos nacen ya
 * atribuidos. Una alianza los estrena sin decidir, porque repartirlos —o dejarlos
 * fuera del convenio— es justamente el trabajo de la Fase 1.
 */
export function tableroInicial(postulante: Postulante): DistritoActivo[] {
  const porId = new Map(DISTRITOS.map((d) => [d.id_distrito, d]))
  return competitividad(postulante).map((comp) => {
    const distrito = porId.get(comp.id_distrito)
    if (!distrito) throw new Error(`Distrito ${comp.id_distrito} ausente del catálogo`)
    return {
      ...distrito,
      ...comp,
      postulacion:
        postulante.integrantes.length === 1
          ? { modo: 'convenio', partido: postulante.integrantes[0], formula: null }
          : { modo: 'sin-decidir' },
    }
  })
}

export function individual(partido: IdPartido): Postulante {
  return { integrantes: [partido], modalidad: 'Individual' }
}

export function coalicion(...integrantes: IdPartido[]): Postulante {
  return { integrantes, modalidad: 'Coalición' }
}
