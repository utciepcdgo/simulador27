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
   * En varios tableros parciales el artículo 28 no admite reparto, porque el
   * 28.2 cierra justo las posiciones que otra regla necesitaría: en 5 y 11 deja
   * al bloque bajo sin la mayoría femenina que le piden el 28.4 y el 28.5, y en
   * 7 y 8 lo deja sin ninguna posición abierta cuando su propio tope de género
   * exige al menos una mujer. Cuando eso ocurre se devuelve el acomodo que más
   * se acerca en lugar de no devolver nada, y se dice qué quedó fuera. El
   * simulador refleja, no impide.
   */
  irresolubles: string[]
}

interface Franja {
  bloque: Bloque
  tamano: number
  /**
   * Cuántas mujeres puede llegar a tener el bloque: las que ya están más los
   * huecos que la prohibición del 28.2 no cerró. Es un límite material, no
   * jurídico: por encima de él no hay dónde colocarlas.
   */
  techo: number
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
    const abiertos = delBloque.filter((d) => !d.esBlindada && !d.formula_asignada).length
    return {
      bloque,
      tamano: tamanos[bloque],
      techo: mujeres + abiertos,
      tope: Math.ceil(tamanos[bloque] / 2),
      mayoria: Math.floor(tamanos[bloque] / 2) + 1,
      esImpar: tamanos[bloque] % 2 === 1,
      colocadas: mujeres,
    }
  })
}

/**
 * Cuántas mujeres exige y cuántas admite cada bloque, como intervalo cerrado.
 *
 * El mínimo lo fijan la paridad del bloque —los hombres tampoco pasan del tope—
 * y lo ya colocado, que el reparto no deshace. El máximo, ese mismo tope y el
 * techo material del bloque.
 *
 * El intervalo puede salir **vacío**, y cuando sale vacío se devuelve vacío. Es
 * lo que ocurre en los tableros de 7 y 8 distritos: el 28.2 cierra las dos
 * posiciones del bloque bajo y el tope de ese bloque exige al menos una mujer.
 * Ensanchar el rango para que parezca resoluble no resuelve nada —solo traslada
 * el descarte al paso constructivo, que lo haría en silencio—.
 */
function rango(f: Franja): [number, number] {
  return [Math.max(f.colocadas, f.tamano - f.tope), Math.min(f.tope, f.techo)]
}

interface Acomodo {
  reparto: number[]
  cumpleMayoria: boolean
  cumplePiso: boolean
  /** Bloques cuyo rango salió vacío, y que por tanto ningún reparto satisface. */
  sinAcomodo: Bloque[]
}

/**
 * Cuántas fórmulas encabezadas por mujeres lleva cada bloque.
 *
 * Se enumera sobre lo que cada bloque **puede llegar a tener** —de lo ya
 * colocado a su techo—, no sobre lo que se le exige. Son unas pocas decenas de
 * combinaciones, y hacerlo así garantiza que lo propuesto se pueda colocar
 * incluso cuando el rango del bloque salió vacío.
 *
 * Se elige la mejor por orden lexicográfico: primero la que respeta la paridad
 * en más bloques, que es la regla que decide dónde cabe cada mujer; luego la que
 * satisface la mayoría del 28.4 o el 28.5; luego la que alcanza el piso del
 * 23.1; y entre las que empatan, la de menos mujeres.
 *
 * Que la paridad de bloque vaya primero no es un descuido del piso general: un
 * reparto que la rompiera para llegar al piso cambiaría un incumplimiento por
 * otro, y lo haría en el bloque más rentable, que sí tenía acomodo válido.
 *
 * Se prefiere el mínimo y no el máximo a propósito: el reparto propone lo que la
 * norma exige, no lo que permite. Quien quiera más lo coloca a mano.
 */
function mujeresPorBloque(ambito: Ambito, franjas: Franja[]): Acomodo {
  const piso = minimoMujeres(ambito.distritos.length)
  const impares = franjas.filter((f) => f.esImpar)
  const requeridos = impares.length === 3 ? 2 : impares.length > 0 ? 1 : 0
  const rangos = franjas.map(rango)

  let mejor: Acomodo | null = null
  let puntajeMejor = -1
  let totalMejor = Infinity
  for (let a = franjas[0].colocadas; a <= franjas[0].techo; a += 1) {
    for (let m = franjas[1].colocadas; m <= franjas[1].techo; m += 1) {
      for (let b = franjas[2].colocadas; b <= franjas[2].techo; b += 1) {
        const reparto = [a, m, b]
        const sinAcomodo = franjas
          .filter((_, i) => reparto[i] < rangos[i][0] || reparto[i] > rangos[i][1])
          .map((f) => f.bloque)
        const conMayoria = franjas.filter(
          (f, i) => f.esImpar && reparto[i] >= f.mayoria,
        ).length
        const cumpleMayoria = conMayoria >= requeridos
        const total = a + m + b
        const cumplePiso = total >= piso
        const puntaje =
          (BLOQUES.length - sinAcomodo.length) * 4 + (cumpleMayoria ? 2 : 0) + (cumplePiso ? 1 : 0)
        if (puntaje > puntajeMejor || (puntaje === puntajeMejor && total < totalMejor)) {
          mejor = { reparto, cumpleMayoria, cumplePiso, sinAcomodo }
          puntajeMejor = puntaje
          totalMejor = total
        }
      }
    }
  }
  return mejor ?? { reparto: [0, 0, 0], cumpleMayoria: false, cumplePiso: false, sinAcomodo: [] }
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
 *
 * El paso constructivo nunca descarta una mujer por falta de sitio: el reparto
 * viene acotado por el techo de cada bloque, así que `porColocar` siempre cabe
 * en los huecos abiertos. Lo que no cabe se dijo antes, en `irresolubles`.
 */
export function repartoNecesario(ambito: Ambito): Reparto {
  const franjas = franjasDe(ambito)
  const { reparto, cumpleMayoria, cumplePiso, sinAcomodo } = mujeresPorBloque(ambito, franjas)

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

  // Los bloques van primero porque son la causa: cuando uno se queda sin
  // acomodo, el piso del 23.1 suele caerse detrás.
  const irresolubles = sinAcomodo.map((bloque) => `Paridad del bloque ${bloque}`)
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
