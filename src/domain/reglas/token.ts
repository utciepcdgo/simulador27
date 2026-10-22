import { esMujer } from '../genero'
import type { DistritoEvaluado, ResultadoRegla, TokenFormula } from '../types'
import { alcanzaProhibicion } from './base'
import { CRITERIOS_LEY, type Criterios } from './criterios'
import { REGLA_PROHIBICION_MENOR_VOTACION } from './mr'
import { FUNDAMENTOS } from './fundamentos'

const ALCANCE = 'Fórmula'

/**
 * Homogeneidad de género.
 *
 * Si la propietaria es mujer, la suplente debe ser mujer. Un suplente no binario
 * se rechaza: para efectos de paridad cuenta como hombre, así que admitirlo
 * permitiría perder una mujer en la sustitución.
 *
 * Si la persona propietaria es hombre o no binario, la suplencia es libre.
 *
 * Es la **única** regla que invalida una fórmula por cómo está armada. La
 * homogeneidad de grupo en desventaja no lo es: ver `validarFormula`.
 */
export function homogeneidadGenero(formula: TokenFormula): ResultadoRegla {
  const { propietario, suplente } = formula
  const cumple = !esMujer(propietario) || suplente.genero === 'Mujer'
  return {
    regla: 'Homogeneidad de género de la fórmula',
    ambito: 'Token',
    alcance: ALCANCE,
    cumple,
    gravedad: cumple ? undefined : 'sustitucion',
    mensaje: cumple
      ? 'La fórmula es homogénea.'
      : `Una fórmula encabezada por una mujer requiere suplencia mujer. La de esta fórmula es ${
          suplente.genero === 'No Binario' ? 'una persona no binaria' : 'un hombre'
        }.`,
    fundamento_legal: FUNDAMENTOS.homogeneidadGenero,
  }
}

/**
 * Reglas que deciden si una fórmula puede existir.
 *
 * Solo el género. Una fórmula que combina grupos —propietaria indígena con
 * suplencia de la diversidad sexual, o con suplencia sin adscripción alguna— es
 * una candidatura **válida**: se registra sin medida compensatoria y compite con
 * normalidad. Lo único que pierde es la acreditación, porque la homogeneidad de
 * grupo condiciona *contar para la medida*, no *poder postularse*.
 *
 * Tratarla como requisito de validez le quitaría a una persona indígena el
 * derecho a elegir libremente su suplencia, que es exactamente lo contrario de
 * lo que la acción afirmativa persigue.
 */
export function validarFormula(formula: TokenFormula): ResultadoRegla[] {
  return [homogeneidadGenero(formula)]
}

function rechazoBlindaje(distrito: DistritoEvaluado, criterios: Criterios): ResultadoRegla {
  return {
    regla: REGLA_PROHIBICION_MENOR_VOTACION,
    ambito: 'MR',
    alcance: `Distrito ${distrito.numero_romano}`,
    cumple: false,
    gravedad: 'sustitucion',
    mensaje: `La posición de rentabilidad ${distrito.posicion_rentabilidad} está entre las de menor porcentaje de votación. No admite ${
      criterios.alcanceMenorVotacion === 'candidatura'
        ? 'ninguna candidatura de mujer, ni propietaria ni suplente'
        : 'fórmulas encabezadas por mujeres'
    }.`,
    fundamento_legal: FUNDAMENTOS.blindajeBaja,
    implicados: [distrito.id_distrito],
  }
}

/**
 * ¿Puede esta fórmula ocupar este distrito? Es la consulta que hace el
 * `onDragEnd` antes de aceptar el movimiento.
 *
 * Queda un solo impedimento: la prohibición del artículo 28.2 en los distritos
 * de menor porcentaje de votación. **No hay espacios reservados.** El Distrito
 * XV rebotaba aquí toda fórmula que no acreditara la adscripción indígena, y eso
 * excedía la norma: el artículo 56.1 dice que los partidos «podrán» postularla y
 * el 56.2 la llama «optativa más no limitativa». Impedir una
 * postulación lícita es el error más grave que puede cometer esta herramienta.
 */
export function admiteEnDistrito(
  formula: TokenFormula,
  distrito: DistritoEvaluado,
  criterios: Criterios = CRITERIOS_LEY,
): ResultadoRegla | null {
  if (distrito.esBlindada && alcanzaProhibicion(formula, criterios)) {
    return rechazoBlindaje(distrito, criterios)
  }
  return null
}
