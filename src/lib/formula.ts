import { accionAfirmativaEfectiva } from '../domain/genero'
import { accionAfirmativaAcreditada, esFormulaJoven } from '../domain/reglas'
import type { AccionAfirmativa, Genero, PerfilCandidato, TokenFormula } from '../domain/types'
import { ROTULO_GENERO, ROTULO_GRUPO } from './rotulos'

/**
 * Cuotas que la fórmula acredita. Delega en el motor: la interfaz no vuelve a
 * decidir qué acredita una fórmula, solo lo muestra.
 */
export function cuotasAcreditadas(formula: TokenFormula): string[] {
  const salida: string[] = []
  if (esFormulaJoven(formula)) salida.push(ROTULO_GRUPO.Joven)
  const grupo = accionAfirmativaAcreditada(formula)
  if (grupo) salida.push(ROTULO_GRUPO[grupo])
  return salida
}

/** Si algún integrante pertenece a un grupo en desventaja o es joven. */
function invocaMedida(formula: TokenFormula): boolean {
  return (
    formula.propietario.esJoven ||
    formula.suplente.esJoven ||
    accionAfirmativaEfectiva(formula.propietario) !== 'Ninguna' ||
    accionAfirmativaEfectiva(formula.suplente) !== 'Ninguna'
  )
}

/**
 * La fórmula combina grupos distintos: es una candidatura válida que se registra
 * sin medida compensatoria y no acredita ninguna.
 *
 * Se muestra en la ficha porque la pregunta que se hace quien la arma es
 * exactamente esa —"tengo una persona indígena aquí, ¿por qué no se enciende la
 * medida?"— y el silencio se lee como un error de la herramienta.
 */
export function esViaOrdinaria(formula: TokenFormula): boolean {
  return invocaMedida(formula) && cuotasAcreditadas(formula).length === 0
}

/** Descripción textual de una fórmula, para etiquetas accesibles y menús. */
export function descripcion(formula: TokenFormula): string {
  const cuotas = cuotasAcreditadas(formula)
  const sufijo = cuotas.length
    ? `, acredita la medida compensatoria de ${cuotas.join(' y ')}`
    : esViaOrdinaria(formula)
      ? ', sin medida compensatoria'
      : ''
  return `Fórmula ${ROTULO_GENERO[formula.propietario.genero]} propietaria, ${ROTULO_GENERO[formula.suplente.genero]} suplente${sufijo}`
}

/** Los géneros y las medidas, en el orden en que se ofrecen en pantalla. */
export const GENEROS: Genero[] = ['Mujer', 'Hombre', 'No Binario']

export const ACCIONES: AccionAfirmativa[] = [
  'Ninguna',
  'Indígena',
  'Discapacidad',
  'Diversidad Sexual',
  'Adulto Mayor',
  'Migrante',
]

export const PERFIL_INICIAL: PerfilCandidato = {
  genero: 'Mujer',
  esJoven: false,
  accionAfirmativa: 'Ninguna',
}

/** Si dos perfiles se postulan con los mismos atributos jurídicos. */
export function mismosAtributos(a: PerfilCandidato, b: PerfilCandidato): boolean {
  return (
    a.genero === b.genero && a.esJoven === b.esJoven && a.accionAfirmativa === b.accionAfirmativa
  )
}
