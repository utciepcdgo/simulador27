import { BLOQUES, posicionesBlindadas, tamanosDeBloque } from '../catalogo/rentabilidad'
import type { Bloque } from '../types'
import type { Criterios } from './criterios'

/**
 * Cuántas fórmulas encabezadas por mujeres **caben** en un ámbito y cuántas
 * **exige**, antes de colocar nada.
 *
 * Todo lo de aquí depende del tamaño del ámbito y de nada más. No mira fórmulas
 * colocadas, y es a propósito: si el cálculo dependiera de lo que ya está en el
 * tablero, las posiciones cerradas por el artículo 28.2 se abrirían y cerrarían
 * mientras alguien arrastra fichas, y una prohibición que se mueve no se puede
 * respetar. El ámbito fija sus límites al nacer.
 *
 * Es el soporte de la lectura proporcional del artículo 27, numeral 1, punto V,
 * que se ofrece como criterio de interpretación y **no corre en producción**.
 * Ver `posicionesBlindadasProporcionales`.
 *
 * El motor tiene otra búsqueda parecida en `reparto.ts`, y no sobra ninguna de
 * las dos: aquélla propone géneros distrito por distrito sobre un tablero a
 * medio llenar, y ésta contesta si el tablero tiene solución antes de que exista.
 */

/** Mínimo de fórmulas encabezadas por mujeres para alcanzar el 50% (artículo 23.1). */
export function minimoMujeres(total: number): number {
  return Math.ceil(total / 2)
}

/**
 * Cuántas posiciones cierra el artículo 28.2 cuando nada lo impide: las dos de
 * menor porcentaje de votación del último bloque.
 */
const BLINDAJE_MAXIMO = 2

/** Cuántas fórmulas encabezadas por mujeres admite y exige un bloque. */
interface Franja {
  bloque: Bloque
  tamano: number
  /**
   * El tope del artículo 26.3 mirado desde el otro género.
   *
   * La regla que emite el motor rechaza que **cualquiera** de los dos géneros
   * supere el tope del bloque, así que un tope de mujeres es también un piso: un
   * bloque de dos distritos con tope uno no admite dos hombres. Omitirlo daría
   * por buenos repartos que `paridadBloques` reprueba.
   */
  minimo: number
  /** El menor entre el tope del 26.3 y los distritos que el 28.2 no cerró. */
  maximo: number
  /** Mayoría estricta, la que piden el 28.4 y el 28.5. */
  mayoria: number
  esImpar: boolean
}

function franjasDe(total: number, blindaje: number): Franja[] {
  const tamanos = tamanosDeBloque(total)
  return BLOQUES.map((bloque) => {
    const tamano = tamanos[bloque]
    const tope = Math.ceil(tamano / 2)
    const cerradas = bloque === 'Baja' ? Math.min(blindaje, tamano) : 0
    return {
      bloque,
      tamano,
      minimo: tamano - tope,
      maximo: Math.min(tope, tamano - cerradas),
      mayoria: Math.floor(tamano / 2) + 1,
      esImpar: tamano % 2 === 1,
    }
  })
}

/** Cuántos bloques impares deben llevar mayoría femenina (artículos 28.4 y 28.5). */
function mayoriasExigidas(franjas: readonly Franja[]): number {
  const impares = franjas.filter((f) => f.esImpar).length
  if (impares === 3) return 2
  return impares > 0 ? 1 : 0
}

export type RepartoPorBloque = Record<Bloque, number>

/**
 * El reparto con menos mujeres que satisface a la vez el piso del 23.1, el tope
 * del 26.3, la mayoría del 28.4 o el 28.5 y un blindaje de `blindaje` posiciones.
 * `null` cuando ninguno lo hace.
 *
 * Se enumeran todas las combinaciones. Tres bloques con rangos de a lo sumo seis
 * valores dan unas pocas decenas de casos, así que la búsqueda exhaustiva es más
 * barata que el razonamiento que haría falta para evitarla, y no puede
 * equivocarse en un caso de frontera.
 *
 * Se prefiere el mínimo por la misma razón que en `reparto.ts`: lo que interesa
 * es si la norma **se puede** cumplir, no cuánto se podría exceder.
 */
export function repartoMinimo(total: number, blindaje: number): RepartoPorBloque | null {
  const franjas = franjasDe(total, blindaje)
  const piso = minimoMujeres(total)
  const exigidas = mayoriasExigidas(franjas)

  let mejor: number[] | null = null
  let menorSuma = Infinity
  for (let alta = franjas[0].minimo; alta <= franjas[0].maximo; alta += 1) {
    for (let media = franjas[1].minimo; media <= franjas[1].maximo; media += 1) {
      for (let baja = franjas[2].minimo; baja <= franjas[2].maximo; baja += 1) {
        const reparto = [alta, media, baja]
        const suma = alta + media + baja
        if (suma < piso || suma >= menorSuma) continue
        const conMayoria = franjas.filter(
          (f, i) => f.esImpar && reparto[i] >= f.mayoria,
        ).length
        if (conMayoria < exigidas) continue
        mejor = reparto
        menorSuma = suma
      }
    }
  }

  if (!mejor) return null
  return { Alta: mejor[0], Media: mejor[1], Baja: mejor[2] }
}

/**
 * El mayor blindaje que deja al ámbito con solución.
 *
 * Es el Nivel 3 de la lectura proporcional: el piso de paridad del 23.1 y la
 * mayoría en bloques impares del 28.4 y 28.5 no ceden nunca, y la prohibición
 * del 28.2 se aplica **con la mayor extensión que quepa** sin volver imposible
 * el ámbito. Nunca cierra más de las dos posiciones que el 28.2 nombra, ni más
 * distritos de los que tenga el bloque Bajo.
 *
 * La comprobación que sostiene todo esto está en las pruebas: con seis distritos
 * este cálculo llega por su cuenta a **un** distrito cerrado, que es lo que el
 * artículo 28.7 manda por escrito para ese caso exacto. El único tamaño parcial
 * donde el reglamento resolvió el conflicto de su puño y letra es también el
 * único donde se puede contrastar el modelo, y coinciden.
 */
export function blindajeFactible(total: number): number {
  const { Baja } = tamanosDeBloque(total)
  for (let cerradas = Math.min(BLINDAJE_MAXIMO, Baja); cerradas > 0; cerradas -= 1) {
    if (repartoMinimo(total, cerradas)) return cerradas
  }
  return 0
}

/**
 * Las posiciones que el artículo 28.2 cierra bajo la lectura proporcional del
 * artículo 27, numeral 1, punto V: las de menor porcentaje de votación del
 * ámbito, tantas como quepan sin impedir la paridad.
 *
 * Misma forma que `posicionesBlindadas`, para que quien las consuma no tenga que
 * saber cuál de las dos lecturas las produjo. Nunca devuelve una posición que la
 * lectura literal deje abierta: solo puede cerrar menos, jamás más.
 */
export function posicionesBlindadasProporcionales(total: number): number[] {
  const cerradas = blindajeFactible(total)
  return Array.from({ length: cerradas }, (_, i) => total - cerradas + 1 + i)
}

/** Si la lectura literal del 28.2 deja al ámbito sin ninguna composición válida. */
export function sinSolucionLiteral(total: number): boolean {
  return repartoMinimo(total, posicionesBlindadas(total).length) === null
}

/**
 * Las posiciones que el artículo 28.2 cierra en un ámbito de `total` distritos,
 * según el criterio vigente.
 *
 * Es el **único** punto por el que la lectura proporcional entra al motor. Todo
 * lo demás —el rebote del arrastre, el reparto sugerido, el dictamen, el
 * documento en PDF— lee `esBlindada` y no necesita saber cuál de las dos
 * lecturas lo produjo.
 *
 * En producción `criteriosVigentes` devuelve siempre `CRITERIOS_LEY`, así que
 * esta función devuelve siempre lo mismo que `posicionesBlindadas`.
 */
export function posicionesBlindadasSegun(total: number, criterios: Criterios): number[] {
  return criterios.aritmeticaImposible === 'blindajeProporcional'
    ? posicionesBlindadasProporcionales(total)
    : posicionesBlindadas(total)
}
