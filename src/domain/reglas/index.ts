import { siglasDe } from '../catalogo/partidos'
import type { EstadoSimulacion, IdPartido, ResultadoRegla, TokenFormula } from '../types'
import { ambitosDe } from './base'
import { integracionDelConvenio } from './convenio'
import { CRITERIOS_LEY, type Criterios } from './criterios'
import { evaluarMR, umbralRegistroRP } from './mr'
import { ambitosRP, evaluarListaRP } from './rp'
import { validarFormula } from './token'

export {
  ambitosDe,
  type Ambito,
  type TipoAmbito,
} from './base'
export {
  accionAfirmativaAcreditada,
  acreditaIndigena,
  conteoGenero,
  distritoEnPosicion,
  esFormulaJoven,
  minimoMujeres,
  type ConteoGenero,
} from './base'
export {
  claseDeConvenio,
  integracionDelConvenio,
  MINIMO_FLEXIBLE,
  MINIMO_PARCIAL,
  repartirConvenio,
  type ClaseConvenio,
  type ReparticionConvenio,
} from './convenio'
export {
  CRITERIOS_LEY,
  criteriosFueraDeLey,
  type Criterios,
} from './criterios'
export { FUNDAMENTOS } from './fundamentos'
export { declinaPostular, formulaIndividualDe, formulasEnDistrito } from './base'
export { repartoNecesario, type Reparto } from './reparto'
export {
  GRUPOS,
  recontar,
  recuentoDe,
  type Grupo,
  type ParidadDeAmbito,
  type Recuento,
  type RecuentoGrupo,
  type RecuentoPostulacion,
} from './recuento'
export {
  blindajeBaja,
  cuotaIndigena,
  cuotaJoven,
  evaluarMR,
  liderazgoBloque,
  mayoriaBloqueImpar,
  minimoJovenes,
  MINIMO_DISTRITOS_PARA_RP,
  paridadBloques,
  paridadGeneral,
  umbralRegistroRP,
} from './mr'
export {
  accionAfirmativaRP,
  acreditaInclusionRP,
  admiteEnListaRP,
  alternanciaRP,
  ambitosRP,
  encabezadoCompensatorioRP,
  evaluarListaRP,
  evaluarRP,
  generoSubrepresentado,
  POSICIONES_CON_ACCION_AFIRMATIVA,
  POSICIONES_RP,
  type AmbitoRP,
} from './rp'
export { admiteEnDistrito, homogeneidadGenero, validarFormula } from './token'

/** Cada fórmula que hay sobre el tablero, con el rótulo del lugar que ocupa. */
function formulasColocadas(estado: EstadoSimulacion): { alcance: string; formula: TokenFormula }[] {
  const colocadas: { alcance: string; formula: TokenFormula }[] = []

  for (const distrito of estado.distritos) {
    const { postulacion } = distrito
    if (postulacion.modo === 'convenio') {
      if (postulacion.formula) {
        colocadas.push({ alcance: `Distrito ${distrito.numero_romano}`, formula: postulacion.formula })
      }
    } else if (postulacion.modo === 'fuera') {
      for (const [clave, decision] of Object.entries(postulacion.formulas)) {
        // `Object.entries` devuelve las llaves como texto aunque el id sea número.
        const formula = decision === 'sin-postular' ? null : decision
        if (formula) {
          colocadas.push({
            alcance: `Distrito ${distrito.numero_romano} · ${siglasDe(Number(clave) as IdPartido)}`,
            formula,
          })
        }
      }
    }
  }

  for (const lista of estado.listasRP) {
    lista.posiciones.forEach((formula, i) => {
      if (formula) {
        colocadas.push({
          alcance: `${siglasDe(lista.partido)} · Lista "A" posición ${i + 1}`,
          formula,
        })
      }
    })
  }

  return colocadas
}

/**
 * Fórmulas mal construidas que ya están sobre el tablero.
 *
 * La UI impide armarlas, así que en condiciones normales no devuelve nada. Existe
 * porque el estado puede llegar de otra parte —un escenario importado, una
 * versión anterior del archivo— y un dictamen que da por buena una fórmula
 * inválida es peor que uno que no la revisa.
 */
export function evaluarTokens(estado: EstadoSimulacion): ResultadoRegla[] {
  return formulasColocadas(estado).flatMap(({ alcance, formula }) =>
    validarFormula(formula)
      .filter((r) => !r.cumple)
      .map((r) => ({ ...r, alcance })),
  )
}

/**
 * Dictamen completo: la integración del convenio, las fórmulas colocadas, cada
 * tablero de MR con su propio ranking y una Lista "A" por partido.
 */
export function evaluarSimulacion(
  estado: EstadoSimulacion,
  criterios: Criterios = CRITERIOS_LEY,
): ResultadoRegla[] {
  const convenio = integracionDelConvenio(estado)
  const ambitos = ambitosDe(estado)
  const todos = estado.postulante.integrantes
  // De qué partidos habla cada resultado. Se marca aquí, en un solo lugar, y no
  // en cada regla: ninguna de ellas necesita saberlo para calcular.
  const de =
    (partidos: readonly IdPartido[]) =>
    (resultado: ResultadoRegla): ResultadoRegla => ({ ...resultado, partidos })
  return [
    ...(convenio ? [de(todos)(convenio)] : []),
    ...evaluarTokens(estado),
    ...ambitos.flatMap((ambito) =>
      evaluarMR(ambito, criterios).map(de(ambito.partido !== null ? [ambito.partido] : todos)),
    ),
    // El umbral abre —o no— la Lista "A" de cada partido, así que se agrupa con
    // el resto de las reglas de RP y no con las de mayoría relativa.
    ...todos.map((partido) => de([partido])(umbralRegistroRP(ambitos, partido))),
    ...ambitosRP(estado).flatMap((ambito) =>
      evaluarListaRP(ambito).map(de([ambito.partido])),
    ),
  ]
}

export function requierenSustitucion(
  resultados: readonly ResultadoRegla[],
): ResultadoRegla[] {
  return resultados.filter((r) => !r.cumple && r.gravedad === 'sustitucion')
}

export function porCompletar(resultados: readonly ResultadoRegla[]): ResultadoRegla[] {
  return resultados.filter((r) => !r.cumple && r.gravedad === 'por-completar')
}

/** Una postulación se puede cerrar cuando no queda ninguna regla incumplida. */
export function esCerrable(resultados: readonly ResultadoRegla[]): boolean {
  return resultados.every((r) => r.cumple)
}
