import type { AccionAfirmativa, Genero, GeneroParidad, PerfilCandidato } from './types'

/**
 * Género con el que un perfil se contabiliza para efectos de paridad.
 *
 * Las candidaturas no binarias ocupan los espacios correspondientes al género
 * masculino, por ser este el sector que no ha sido discriminado históricamente.
 * Consecuencia: un perfil no binario no suma al mínimo de fórmulas encabezadas
 * por mujeres, y sí puede ocupar las posiciones 14 y 15 blindadas.
 */
export function generoParaParidad(genero: Genero): GeneroParidad {
  return genero === 'Mujer' ? 'Mujer' : 'Hombre'
}

/**
 * Acción afirmativa efectiva de un perfil.
 *
 * Un perfil no binario se reconoce automáticamente como perteneciente al sector
 * en desventaja de la diversidad sexual, sin necesidad de declararlo.
 */
export function accionAfirmativaEfectiva(perfil: PerfilCandidato): AccionAfirmativa {
  if (perfil.genero === 'No Binario') return 'Diversidad Sexual'
  return perfil.accionAfirmativa
}

export function esMujer(perfil: PerfilCandidato): boolean {
  return generoParaParidad(perfil.genero) === 'Mujer'
}
