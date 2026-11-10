import { partidoDe } from '../catalogo/partidos'
import type { IdPartido, Postulante } from '../types'
import { FUNDAMENTOS } from './fundamentos'

/**
 * Qué puede hacer cada partido según su ámbito y su antigüedad de registro.
 *
 * Son dos hechos del padrón —`ambito` y `nuevoRegistro`, que vienen del CSV
 * aprobado— y dos conclusiones jurídicas que se derivan de ellos. Viven juntas
 * aquí porque las dos leen los mismos dos campos y separarlas obligaría a
 * recordar en cada sitio cuál de los dos supuestos del artículo 23.2 aplica.
 *
 * Ojo con una confusión fácil: **«sin historial de votación» no es lo mismo que
 * «local o de nuevo registro»**. Que hoy coincidan los cinco partidos es una
 * casualidad del padrón vigente, no una regla. El historial decide si hay
 * porcentaje que ordenar; el ámbito decide si le aplican los bloques.
 */

/** Los dos supuestos del artículo 9.5: nacional **y** de nuevo registro. */
function esNacionalDeNuevoRegistro(partido: IdPartido): boolean {
  const { ambito, nuevoRegistro } = partidoDe(partido)
  return ambito === 'Nacional' && nuevoRegistro
}

/**
 * Si el partido puede suscribir convenio de coalición (artículo 9.5).
 *
 * Los nacionales de nuevo registro con acreditación ante el Instituto no pueden,
 * ni entre sí ni con nadie.
 */
export function puedeCoaligarse(partido: IdPartido): boolean {
  return !esNacionalDeNuevoRegistro(partido)
}

/**
 * Si el partido puede suscribir convenio de candidatura común (artículo 11.3).
 *
 * Misma condición y mismo alcance que la del 9.5, en otro artículo. Están
 * separadas en dos funciones y no unidas en una porque son dos prohibiciones
 * distintas con su propio fundamento, y el dictamen tiene que citar la que
 * corresponde a la figura que se intentó.
 *
 * Entre las dos cierran las dos formas de postulación conjunta: a un nacional de
 * nuevo registro solo le queda competir en lo individual.
 */
export function puedeSuscribirCandidaturaComun(partido: IdPartido): boolean {
  return !esNacionalDeNuevoRegistro(partido)
}

/** Lo que impide a una alianza constituirse, con el artículo que lo impide. */
export interface ImpedimentoDeConvenio {
  /** Los integrantes vetados, en orden de registro. */
  vetados: IdPartido[]
  fundamento: string
}

/**
 * Qué integrantes no pueden suscribir el convenio de esa modalidad, o `null` si
 * no hay ninguno.
 *
 * La modalidad decide el artículo, y por eso la elección vive aquí y no en la
 * interfaz: que un mensaje cite el 9.5 cuando se intentó una candidatura común
 * es un error de fondo, no de redacción.
 */
export function impedimentoDeConvenio(
  integrantes: readonly IdPartido[],
  modalidad: Postulante['modalidad'],
): ImpedimentoDeConvenio | null {
  if (modalidad === 'Individual') return null
  const permite =
    modalidad === 'Coalición' ? puedeCoaligarse : puedeSuscribirCandidaturaComun
  const vetados = integrantes.filter((partido) => !permite(partido))
  if (vetados.length === 0) return null
  return {
    vetados,
    fundamento:
      modalidad === 'Coalición'
        ? FUNDAMENTOS.coalicionNuevoRegistro
        : FUNDAMENTOS.candidaturaComunNuevoRegistro,
  }
}

/**
 * Si al partido le aplican los bloques de competitividad.
 *
 * Artículo 23.2: no aplican a las candidaturas independientes, a los partidos
 * nacionales de nuevo registro con acreditación ante el Instituto, ni a los
 * partidos locales. El artículo 29.2 lo repite para los locales y explica por
 * qué: es el primer Proceso Electoral Local de diputaciones en que participan.
 *
 * Las candidaturas independientes no se modelan: el simulador trabaja con
 * partidos, y una candidatura independiente no postula quince fórmulas.
 */
export function aplicanBloques(partido: IdPartido): boolean {
  return partidoDe(partido).ambito === 'Nacional' && !partidoDe(partido).nuevoRegistro
}
