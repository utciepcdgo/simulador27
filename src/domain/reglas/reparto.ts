import { BLOQUES, tamanosDeBloque } from '../catalogo/rentabilidad'
import type { Bloque, GeneroParidad } from '../types'
import type { Ambito } from './base'
import { conteoGenero, minimoMujeres } from './base'

/**
 * Qué género debe encabezar la fórmula de cada distrito para que el ámbito
 * cumpla, y qué requisito no se pudo satisfacer si es que alguno.
 */
export interface Reparto {
  /** Género exigido por `id_distrito`. Solo incluye los distritos vacíos. */
  porDistrito: Map<number, GeneroParidad>
  /** Cuántas fórmulas encabezadas por cada género hay que crear. */
  faltan: Record<GeneroParidad, number>
  /** Si además hace falta una fórmula integrada por personas jóvenes. */
  faltaJoven: boolean
  /**
   * Requisitos que ninguna composición satisface en este ámbito.
   *
   * En tableros de 5, 7 y 11 distritos el artículo 28 no admite reparto: el
   * 28.5 exige mayoría femenina en el bloque bajo mientras el 28.2 le cierra las
   * posiciones que harían falta. Cuando eso ocurre se devuelve el acomodo que
   * más se acerca en lugar de no devolver nada, y se dice qué quedó fuera. El
   * simulador refleja, no impide.
   */
  irresolubles: string[]
}

interface Franja {
  bloque: Bloque
  tamano: number
  /** Posiciones donde sí puede ir una fórmula encabezada por mujer (28.2). */
  admisibles: number
  /** Tope por género del bloque; ver `paridadBloques`. */
  tope: number
  /** Mayoría estricta, la que piden el 28.4 y el 28.5. */
  mayoria: number
  esImpar: boolean
  /** Mujeres ya colocadas en el bloque, que el reparto no toca. */
  colocadas: number
}

function franjasDe(ambito: Ambito): Franja[] {
  const tamanos = tamanosDeBloque(ambito.distritos.length)
  return BLOQUES.map((bloque) => {
    const delBloque = ambito.distritos.filter((d) => d.bloque === bloque)
    const { mujeres } = conteoGenero(delBloque)
    return {
      bloque,
      tamano: tamanos[bloque],
      admisibles: delBloque.filter((d) => !d.esBlindada).length,
      tope: Math.ceil(tamanos[bloque] / 2),
      mayoria: Math.floor(tamanos[bloque] / 2) + 1,
      esImpar: tamanos[bloque] % 2 === 1,
      colocadas: mujeres,
    }
  })
}

/** Cuántas mujeres admite y cuántas exige cada bloque, como intervalo. */
function rango(f: Franja): [number, number] {
  const minimo = Math.max(f.colocadas, f.tamano - f.tope)
  const maximo = Math.min(f.tope, f.admisibles)
  return [minimo, Math.max(minimo, maximo)]
}

/**
 * Cuántas fórmulas encabezadas por mujeres lleva cada bloque.
 *
 * Se enumeran todas las combinaciones —tres bloques con rangos de a lo sumo seis
 * valores, así que son unas pocas decenas— y se elige la mejor por orden
 * lexicográfico: primero la que satisface la mayoría del 28.4 o el 28.5, luego
 * la que alcanza el piso del 23.1, y entre las que empatan, la de menos mujeres.
 *
 * Se prefiere el mínimo y no el máximo a propósito: el reparto propone lo que la
 * norma exige, no lo que permite. Quien quiera más lo coloca a mano.
 */
function mujeresPorBloque(ambito: Ambito, franjas: Franja[]): {
  reparto: number[]
  cumpleMayoria: boolean
  cumplePiso: boolean
} {
  const piso = minimoMujeres(ambito.distritos.length)
  const impares = franjas.filter((f) => f.esImpar)
  const requeridos = impares.length === 3 ? 2 : impares.length > 0 ? 1 : 0
  const rangos = franjas.map(rango)

  let mejor: { reparto: number[]; cumpleMayoria: boolean; cumplePiso: boolean } | null = null
  for (let a = rangos[0][0]; a <= rangos[0][1]; a += 1) {
    for (let m = rangos[1][0]; m <= rangos[1][1]; m += 1) {
      for (let b = rangos[2][0]; b <= rangos[2][1]; b += 1) {
        const reparto = [a, m, b]
        const conMayoria = franjas.filter(
          (f, i) => f.esImpar && reparto[i] >= f.mayoria,
        ).length
        const cumpleMayoria = conMayoria >= requeridos
        const total = a + m + b
        const cumplePiso = total >= piso
        const puntaje = (cumpleMayoria ? 4 : 0) + (cumplePiso ? 2 : 0)
        const puntajeMejor = mejor
          ? (mejor.cumpleMayoria ? 4 : 0) + (mejor.cumplePiso ? 2 : 0)
          : -1
        const totalMejor = mejor ? mejor.reparto.reduce((x, y) => x + y, 0) : Infinity
        if (puntaje > puntajeMejor || (puntaje === puntajeMejor && total < totalMejor)) {
          mejor = { reparto, cumpleMayoria, cumplePiso }
        }
      }
    }
  }
  return mejor ?? { reparto: [0, 0, 0], cumpleMayoria: false, cumplePiso: false }
}

/**
 * El reparto de géneros que el ámbito necesita, distrito por distrito.
 *
 * Es constructivo, no una búsqueda: dentro de cada bloque las mujeres van a las
 * posiciones de mayor votación que el 28.2 no cerró. Colocar desde arriba
 * resuelve dos cosas de una vez —nunca cae una mujer en posición prohibida, y la
 * cabeza del bloque queda ocupada por mujer siempre que el bloque lleve al menos
 * una, que es lo que pide el 28.1—.
 *
 * Solo propone para los distritos vacíos. Lo ya colocado se respeta y se cuenta,
 * de modo que el reparto se pueda aplicar sobre un tablero a medio llenar.
 */
export function repartoNecesario(ambito: Ambito): Reparto {
  const franjas = franjasDe(ambito)
  const { reparto, cumpleMayoria, cumplePiso } = mujeresPorBloque(ambito, franjas)

  const porDistrito = new Map<number, GeneroParidad>()
  franjas.forEach((franja, i) => {
    const delBloque = ambito.distritos
      .filter((d) => d.bloque === franja.bloque)
      .sort((a, b) => a.posicion_rentabilidad - b.posicion_rentabilidad)
    let porColocar = reparto[i] - franja.colocadas
    for (const distrito of delBloque) {
      if (distrito.formula_asignada) continue
      const cabeMujer = !distrito.esBlindada && porColocar > 0
      porDistrito.set(distrito.id_distrito, cabeMujer ? 'Mujer' : 'Hombre')
      if (cabeMujer) porColocar -= 1
    }
  })

  const faltan = { Mujer: 0, Hombre: 0 }
  for (const genero of porDistrito.values()) faltan[genero] += 1

  const irresolubles: string[] = []
  if (!cumpleMayoria) irresolubles.push('Mayoría de fórmulas encabezadas por mujeres en bloques impares')
  if (!cumplePiso) irresolubles.push('Paridad general de MR')

  return {
    porDistrito,
    faltan,
    faltaJoven: !ambito.distritos.some(
      (d) => d.formula_asignada?.propietario.esJoven && d.formula_asignada.suplente.esJoven,
    ),
    irresolubles,
  }
}
