import type { IdPartido } from '../domain/types'
import type { DestinoSiglado } from '../store/simulador'

/**
 * Vocabulario de identificadores del arrastre.
 *
 * dnd-kit habla con cadenas, así que el origen y el destino de cada movimiento
 * viajan codificados. Construirlos y leerlos en un solo módulo evita que el
 * formato se invente dos veces y deje de coincidir.
 */

export const SIN_SIGLAR = 'sin-decidir'
export const FUERA_DEL_CONVENIO = 'fuera'
export const ID_BANDEJA = 'bandeja'

/**
 * Codifica un destino de la Fase 1 en texto.
 *
 * Los partidos son números —su orden de registro— y los otros dos destinos son
 * palabras, así que al leer basta con mirar si el código es numérico. Se expone
 * aparte porque los `Select` de la vista móvil necesitan la misma codificación.
 */
export function codigoDestino(destino: DestinoSiglado): string {
  return String(destino)
}

export function leerCodigoDestino(codigo: string): DestinoSiglado {
  if (codigo === SIN_SIGLAR || codigo === FUERA_DEL_CONVENIO) return codigo
  return Number(codigo) as IdPartido
}

export function idColumnaSiglado(destino: DestinoSiglado): string {
  return `siglado:${codigoDestino(destino)}`
}

export function idDistritoArrastrable(id_distrito: number): string {
  return `distrito:${id_distrito}`
}

/**
 * Casilla de mayoría relativa. Un distrito fuera del convenio tiene una casilla
 * por partido, así que el identificador lleva a quién pertenece; en convenio la
 * casilla es una sola y el partido se omite.
 */
export function idCasillaMR(id_distrito: number, partido: IdPartido | null): string {
  return partido ? `mr:${id_distrito}:${partido}` : `mr:${id_distrito}`
}

export function idCasillaRP(partido: IdPartido, posicion: number): string {
  return `rp:${partido}:${posicion}`
}

export type Origen =
  | { tipo: 'distrito'; id_distrito: number }
  | { tipo: 'formula'; id: string }

export type Destino =
  | { tipo: 'siglado'; destino: DestinoSiglado }
  | { tipo: 'bandeja' }
  | { tipo: 'mr'; id_distrito: number; partido: IdPartido | null }
  | { tipo: 'rp'; partido: IdPartido; posicion: number }
  | null

export function leerOrigen(id: string): Origen {
  return id.startsWith('distrito:')
    ? { tipo: 'distrito', id_distrito: Number(id.slice('distrito:'.length)) }
    : { tipo: 'formula', id }
}

export function leerDestino(id: string): Destino {
  if (id === ID_BANDEJA) return { tipo: 'bandeja' }
  if (id.startsWith('siglado:')) {
    return { tipo: 'siglado', destino: leerCodigoDestino(id.slice('siglado:'.length)) }
  }
  if (id.startsWith('mr:')) {
    const [, distrito, partido] = id.split(':')
    return {
      tipo: 'mr',
      id_distrito: Number(distrito),
      partido: partido === undefined ? null : (Number(partido) as IdPartido),
    }
  }
  if (id.startsWith('rp:')) {
    const [, partido, posicion] = id.split(':')
    return { tipo: 'rp', partido: Number(partido) as IdPartido, posicion: Number(posicion) }
  }
  return null
}
