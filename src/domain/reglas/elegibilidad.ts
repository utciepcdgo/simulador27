import { partidoDe } from '../catalogo/partidos'
import type { IdPartido } from '../types'

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
 * Si el partido puede suscribir convenio de coalición.
 *
 * Artículo 9.5: los nacionales de nuevo registro con acreditación ante el
 * Instituto no pueden, ni entre sí ni con nadie. La prohibición está referida al
 * **convenio de coalición**; la candidatura común y la postulación individual
 * no aparecen en el artículo.
 */
export function puedeCoaligarse(partido: IdPartido): boolean {
  return !esNacionalDeNuevoRegistro(partido)
}

/** Los integrantes a los que el 9.5 cierra la coalición, en orden de registro. */
export function sinDerechoACoalicion(integrantes: readonly IdPartido[]): IdPartido[] {
  return integrantes.filter((partido) => !puedeCoaligarse(partido))
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
