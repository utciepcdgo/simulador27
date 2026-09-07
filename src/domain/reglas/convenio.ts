import { siglasDe } from '../catalogo/partidos'
import { TOTAL_DISTRITOS } from '../catalogo/rentabilidad'
import type { EstadoSimulacion, ResultadoRegla } from '../types'
import { FUNDAMENTOS } from './fundamentos'

/**
 * Cuántos distritos debe abarcar el convenio para cada clase de coalición.
 *
 * Artículo 9.1 de los Lineamientos: la parcial abarca al menos el cincuenta por
 * ciento y la flexible al menos el veinticinco. Artículo 9.3: cuando el cálculo
 * del porcentaje da un número fraccionado, se toma el entero siguiente. Sobre
 * quince distritos eso da 8 y 4, que es lo que `Math.ceil` produce.
 */
export const MINIMO_PARCIAL = Math.ceil(TOTAL_DISTRITOS / 2)
export const MINIMO_FLEXIBLE = Math.ceil(TOTAL_DISTRITOS / 4)

export type ClaseConvenio = 'Total' | 'Parcial' | 'Flexible' | 'Insuficiente'

export function claseDeConvenio(siglados: number): ClaseConvenio {
  if (siglados === TOTAL_DISTRITOS) return 'Total'
  if (siglados >= MINIMO_PARCIAL) return 'Parcial'
  if (siglados >= MINIMO_FLEXIBLE) return 'Flexible'
  return 'Insuficiente'
}

export interface ReparticionConvenio {
  siglados: number
  fuera: number
  sinDecidir: number
  /** Distritos donde no se postula: no son un pendiente, son una decisión. */
  sinPostular: number
  clase: ClaseConvenio
}

export function repartirConvenio(estado: EstadoSimulacion): ReparticionConvenio {
  let siglados = 0
  let fuera = 0
  let sinDecidir = 0
  let sinPostular = 0
  for (const distrito of estado.distritos) {
    if (distrito.postulacion.modo === 'convenio') siglados += 1
    else if (distrito.postulacion.modo === 'fuera') fuera += 1
    else if (distrito.postulacion.modo === 'sin-postular') sinPostular += 1
    else sinDecidir += 1
  }
  return { siglados, fuera, sinDecidir, sinPostular, clase: claseDeConvenio(siglados) }
}

/**
 * Integración del convenio.
 *
 * Solo aplica a una alianza. Mientras queden distritos sin decidir la
 * postulación está incompleta —y ningún tablero los está evaluando, así que
 * pasarían inadvertidos—; por debajo del mínimo flexible ya no hay convenio que
 * registrar.
 */
export function integracionDelConvenio(estado: EstadoSimulacion): ResultadoRegla | null {
  if (estado.postulante.integrantes.length === 1) return null
  const { siglados, fuera, sinDecidir, clase } = repartirConvenio(estado)
  const alcance = `${estado.postulante.modalidad} ${estado.postulante.integrantes.map(siglasDe).join('-')}`
  const base = {
    regla: 'Integración del convenio',
    ambito: 'MR' as const,
    alcance,
    fundamento_legal: FUNDAMENTOS.convenio,
  }

  if (sinDecidir > 0) {
    return {
      ...base,
      cumple: false,
      gravedad: 'por-completar',
      mensaje: `Faltan ${sinDecidir} distrito(s) por decidir: cada uno va siglado a un partido del convenio o queda fuera de él, para que cada integrante lo postule por su cuenta.`,
    }
  }
  if (clase === 'Insuficiente') {
    return {
      ...base,
      cumple: false,
      gravedad: 'sustitucion',
      mensaje: `El convenio abarca ${siglados} distrito(s); una coalición flexible requiere cuando menos ${MINIMO_FLEXIBLE}. Por debajo de ese mínimo no hay coalición que registrar.`,
    }
  }
  return {
    ...base,
    cumple: true,
    mensaje: `${estado.postulante.modalidad} ${clase}: ${siglados} distrito(s) en convenio y ${fuera} fuera de él, que cada integrante postula por su cuenta.`,
  }
}
