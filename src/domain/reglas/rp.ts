import {nombreDe, siglasDe} from '../catalogo/partidos'
import { esMujer } from '../genero'
import type {
  AccionAfirmativa,
  DistritoEvaluado,
  EstadoSimulacion,
  GeneroParidad,
  IdPartido,
  ResultadoRegla,
  TokenFormula,
} from '../types'
import { accionAfirmativaAcreditada, ambitosDe, conteoGenero } from './base'
import { CRITERIOS_LEY, type Criterios } from './criterios'
import { FUNDAMENTOS } from './fundamentos'

/** Posiciones de la Lista "A". */
export const POSICIONES_RP = 5

/** Tramo de la lista donde debe aparecer cuando menos una acción afirmativa. */
export const POSICIONES_CON_ACCION_AFIRMATIVA = 3

/**
 * Una Lista "A" con el contexto de MR que la condiciona.
 *
 * La lista se construye por partido, no por alianza: el encabezado compensatorio
 * mira el desempeño de MR de *ese* partido. En coalición son los distritos que
 * sigló; compitiendo solo, los quince.
 */
export interface AmbitoRP {
  partido: IdPartido
  etiqueta: string
  posiciones: readonly (TokenFormula | null)[]
  /** Consolidado de MR del partido: lo que registra dentro y fuera del convenio. */
  distritosMR: readonly DistritoEvaluado[]
}

export function ambitosRP(
  estado: EstadoSimulacion,
  criterios: Criterios = CRITERIOS_LEY,
): AmbitoRP[] {
  const consolidados = new Map(
    ambitosDe(estado, criterios)
      .filter((a) => a.tipo === 'consolidado')
      .map((a) => [a.partido, a.distritos]),
  )
  return estado.listasRP.map((lista) => ({
    partido: lista.partido,
    etiqueta: `${siglasDe(lista.partido)} · Lista "A"`,
    posiciones: lista.posiciones,
    distritosMR: consolidados.get(lista.partido) ?? [],
  }))
}

function generoDe(formula: TokenFormula): GeneroParidad {
  return esMujer(formula.propietario) ? 'Mujer' : 'Hombre'
}

function opuesto(genero: GeneroParidad): GeneroParidad {
  return genero === 'Mujer' ? 'Hombre' : 'Mujer'
}

/**
 * Género que la posición 1 tendría si la posición `posicion` lleva `genero`.
 * En una cremallera perfecta la lista entera queda determinada por su encabezado,
 * así que cada fórmula asignada es una afirmación sobre quién debe encabezar.
 */
function encabezadoImplicito(posicion: number, genero: GeneroParidad): GeneroParidad {
  return posicion % 2 === 1 ? genero : opuesto(genero)
}

interface Alternancia {
  /** Encabezado que exigen las fórmulas ya asignadas, o `null` si no hay ninguna. */
  encabezado: GeneroParidad | null
  /** Posiciones que contradicen ese encabezado. */
  conflictos: number[]
  vacias: number[]
}

/**
 * Lee la cremallera de una lista posiblemente incompleta.
 *
 * No compara posiciones contiguas: eso daría por buena una lista con huecos que
 * en realidad ya es irreparable. Cada fórmula se traduce al encabezado que
 * implica y se exige que todas impliquen el mismo.
 *
 * El encabezado dominante se decide por mayoría, no por la posición 1. Así el
 * dictamen señala las fórmulas que hay que mover —que son las menos— y no las
 * cuatro que ya estaban alineadas entre sí. Los empates los resuelve la primera
 * posición asignada, para que el resultado sea reproducible.
 */
function alternanciaDe(posiciones: readonly (TokenFormula | null)[]): Alternancia {
  const implicitos = new Map<number, GeneroParidad>()
  const vacias: number[] = []
  let mujer = 0
  for (let i = 0; i < posiciones.length; i += 1) {
    const formula = posiciones[i]
    const posicion = i + 1
    if (!formula) {
      vacias.push(posicion)
      continue
    }
    const implicito = encabezadoImplicito(posicion, generoDe(formula))
    implicitos.set(posicion, implicito)
    if (implicito === 'Mujer') mujer += 1
  }
  if (implicitos.size === 0) return { encabezado: null, conflictos: [], vacias }

  const hombre = implicitos.size - mujer
  const primero = [...implicitos.values()][0]
  const encabezado: GeneroParidad =
    mujer === hombre ? primero : mujer > hombre ? 'Mujer' : 'Hombre'
  const conflictos = [...implicitos.entries()]
    .filter(([, implicito]) => implicito !== encabezado)
    .map(([posicion]) => posicion)
  return { encabezado, conflictos, vacias }
}

/**
 * Género subrepresentado en las candidaturas de MR del partido, que es el que
 * debe encabezar su Lista "A".
 *
 * Devuelve `null` cuando ninguno lo está: equivalencia exacta o —caso del
 * partido que sigló cero distritos en el convenio— cero contra cero. En ambos el
 * partido determina libremente el encabezado, que es la lectura más restrictiva
 * posible del silencio de la norma: no se puede compensar una subrepresentación
 * que no existe.
 */
export function generoSubrepresentado(
  distritosMR: readonly DistritoEvaluado[],
): GeneroParidad | null {
  const { mujeres, hombres } = conteoGenero(distritosMR)
  if (mujeres < hombres) return 'Mujer'
  if (hombres < mujeres) return 'Hombre'
  return null
}

/**
 * Alternancia de género en la Lista "A".
 *
 * Un conflicto es infracción inmediata —ninguna asignación futura reconcilia dos
 * fórmulas que exigen encabezados opuestos—; los huecos son pendientes.
 */
export function alternanciaRP(ambito: AmbitoRP): ResultadoRegla {
  const { encabezado, conflictos, vacias } = alternanciaDe(ambito.posiciones)
  const cumple = conflictos.length === 0 && vacias.length === 0
  let mensaje: string
  if (cumple) {
    mensaje = `La lista alterna correctamente a partir de una posición 1 encabezada por ${encabezado === 'Mujer' ? 'mujer' : 'hombre'}.`
  } else if (conflictos.length > 0) {
    mensaje = `${
      conflictos.length === 1
        ? `La posición ${conflictos[0]} no alterna`
        : `Las posiciones ${conflictos.join(', ')} no alternan`
    } con el resto de la lista. La posición 1 debe encabezarla ${encabezado === 'Mujer' ? 'una mujer' : 'un hombre'}.`
  } else {
    mensaje = `${
      vacias.length === 1 ? 'Falta 1 posición' : `Faltan ${vacias.length} posiciones`
    } por asignar: ${vacias.join(', ')}.`
  }
  return {
    regla: 'Alternancia de género en RP',
    ambito: 'RP',
    alcance: ambito.etiqueta,
    cumple,
    gravedad: cumple ? undefined : conflictos.length > 0 ? 'sustitucion' : 'por-completar',
    mensaje,
    fundamento_legal: FUNDAMENTOS.alternanciaRP,
    implicados: conflictos.length > 0 ? conflictos : vacias,
  }
}

/**
 * Encabezado compensatorio.
 *
 * Mientras el partido tenga distritos de MR sin asignar, un encabezado que hoy
 * contradice la compensación todavía es reparable —moviendo la lista o moviendo
 * MR—, así que es pendiente y no dispara rebote. Con MR completo ya no hay
 * jugada que lo arregle: es infracción.
 */
export function encabezadoCompensatorioRP(ambito: AmbitoRP): ResultadoRegla {
  const exigido = generoSubrepresentado(ambito.distritosMR)
  const { sinAsignar } = conteoGenero(ambito.distritosMR)
  const encabeza = ambito.posiciones[0]
  const mrCompleto = sinAsignar === 0
  const base = {
    regla: 'Encabezado compensatorio de RP',
    ambito: 'RP' as const,
    alcance: ambito.etiqueta,
    fundamento_legal: FUNDAMENTOS.encabezadoCompensatorioRP,
    implicados: [1],
  }

  if (!encabeza) {
    return {
      ...base,
      cumple: false,
      gravedad: 'por-completar',
      mensaje: exigido
        ? `La posición 1 está vacía. Debe encabezarla ${exigido === 'Mujer' ? 'una mujer' : 'un hombre'}, el género subrepresentado en la mayoría relativa de ${nombreDe(ambito.partido)}.`
        : 'La posición 1 está vacía. La mayoría relativa de este partido está en equivalencia entre géneros. Cualquier género puede encabezar la lista.',
    }
  }
  if (!exigido) {
    return {
      ...base,
      cumple: true,
      mensaje: `La mayoría relativa de ${nombreDe(ambito.partido)} está en equivalencia entre géneros. El encabezado de la lista es de libre determinación.`,
    }
  }
  const genero = generoDe(encabeza)
  const cumple = genero === exigido
  return {
    ...base,
    cumple,
    gravedad: cumple ? undefined : mrCompleto ? 'sustitucion' : 'por-completar',
    mensaje: cumple
      ? `La lista la encabeza ${exigido === 'Mujer' ? 'una mujer' : 'un hombre'}, género subrepresentado en la mayoría relativa de ${nombreDe(ambito.partido)}.`
      : `La lista la encabeza ${genero === 'Mujer' ? 'una mujer' : 'un hombre'}. El género subrepresentado en la mayoría relativa de ${nombreDe(ambito.partido)} es ${exigido === 'Mujer' ? 'el femenino' : 'el masculino'}.${mrCompleto ? '' : ' Quedan distritos de mayoría relativa por asignar.'}`,
  }
}

/**
 * Grupos en desventaja que satisfacen la cuota de inclusión de la Lista "A".
 *
 * La juventud y la adscripción indígena quedan fuera a propósito: la norma las
 * atiende territorialmente en mayoría relativa —una fórmula joven en cualquier
 * distrito y el Distrito XV— y no las enumera entre los grupos de RP. Una
 * fórmula indígena en la posición 2, por tanto, no acredita esta cuota.
 */
const GRUPOS_EN_DESVENTAJA_RP: readonly AccionAfirmativa[] = [
  'Discapacidad',
  'Diversidad Sexual',
  'Adulto Mayor',
  'Migrante',
]

export function acreditaInclusionRP(formula: TokenFormula): boolean {
  const grupo = accionAfirmativaAcreditada(formula)
  return grupo !== null && GRUPOS_EN_DESVENTAJA_RP.includes(grupo)
}

/**
 * Medida compensatoria en las tres primeras posiciones de la Lista "A".
 *
 * Se exige la fórmula completa —ambos integrantes del mismo grupo—, por
 * consistencia con la decisión 4, aunque el brief §6.C diga "un perfil".
 */
export function accionAfirmativaRP(ambito: AmbitoRP): ResultadoRegla {
  const tramo = ambito.posiciones.slice(0, POSICIONES_CON_ACCION_AFIRMATIVA)
  const acreditadas: number[] = []
  const vacias: number[] = []
  tramo.forEach((formula, i) => {
    if (!formula) vacias.push(i + 1)
    else if (acreditaInclusionRP(formula)) acreditadas.push(i + 1)
  })
  const cumple = acreditadas.length > 0
  let mensaje: string
  if (cumple) {
    mensaje = `La posición ${acreditadas.join(', ')} acredita un grupo o sector social en desventaja.`
  } else if (vacias.length > 0) {
    mensaje = `Ninguna de las tres primeras posiciones acredita todavía un grupo o sector social en desventaja; quedan ${vacias.length} por asignar.`
  } else {
    mensaje =
      'Ninguna de las tres primeras posiciones acredita un grupo o sector social en desventaja (personas con discapacidad permanente, de la diversidad sexual, adultas mayores o migrantes), y las tres ya están ocupadas.'
  }
  return {
    regla: 'Medida compensatoria en la Lista "A"',
    ambito: 'RP',
    alcance: ambito.etiqueta,
    cumple,
    gravedad: cumple ? undefined : vacias.length > 0 ? 'por-completar' : 'sustitucion',
    mensaje,
    fundamento_legal: FUNDAMENTOS.accionAfirmativaRP,
    implicados: [1, 2, 3],
  }
}

export function evaluarListaRP(ambito: AmbitoRP): ResultadoRegla[] {
  return [
    encabezadoCompensatorioRP(ambito),
    alternanciaRP(ambito),
    accionAfirmativaRP(ambito),
  ]
}

export function evaluarRP(estado: EstadoSimulacion): ResultadoRegla[] {
  return ambitosRP(estado).flatMap(evaluarListaRP)
}

/**
 * ¿Admite la lista esta fórmula en esa posición? Es la consulta del `onDragEnd`
 * de la Fase 3, y solo devuelve lo que ya es irreparable: lo que todavía puede
 * corregirse pertenece al dictamen, no al rebote.
 */
export function admiteEnListaRP(
  ambito: AmbitoRP,
  posicion: number,
  formula: TokenFormula,
): ResultadoRegla | null {
  const tentativa = ambito.posiciones.map((actual, i) => (i + 1 === posicion ? formula : actual))
  const resultado = alternanciaRP({ ...ambito, posiciones: tentativa })
  if (resultado.gravedad === 'sustitucion') {
    return {
      ...resultado,
      mensaje: `La posición ${posicion} de la Lista "A" corresponde a una fórmula encabezada por ${generoDe(formula) === 'Mujer' ? 'un hombre' : 'una mujer'}.`,
      implicados: [posicion],
    }
  }
  if (posicion !== 1) return null
  const encabezado = encabezadoCompensatorioRP({ ...ambito, posiciones: tentativa })
  return encabezado.gravedad === 'sustitucion' ? encabezado : null
}
