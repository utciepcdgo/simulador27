import { siglasDe } from '../catalogo/partidos'
import { integrarBloques, porcentajesDe } from '../catalogo/rentabilidad'
import { accionAfirmativaEfectiva, esMujer } from '../genero'
import { CRITERIOS_LEY, type Criterios } from './criterios'
import { aplicanBloques } from './elegibilidad'
import { posicionesBlindadasSegun } from './holgura'
import type {
  AccionAfirmativa,
  DistritoActivo,
  DistritoEvaluado,
  EstadoSimulacion,
  IdPartido,
  Postulacion,
  TokenFormula,
} from '../types'

// ─── Decisiones individuales fuera del convenio ─────────────────────────────

/**
 * La fórmula que un integrante puso en un distrito fuera del convenio.
 *
 * `null` tanto si no ha puesto ninguna como si declinó postular: en las dos
 * situaciones no hay candidatura que evaluar, y quien necesita distinguirlas
 * pregunta por `declinaPostular`.
 */
export function formulaIndividualDe(
  postulacion: Postulacion,
  partido: IdPartido,
): TokenFormula | null {
  if (postulacion.modo !== 'fuera') return null
  const decision = postulacion.formulas[partido]
  return decision && decision !== 'sin-postular' ? decision : null
}

/** Si el integrante declaró que no postula en este distrito (artículo 27). */
export function declinaPostular(postulacion: Postulacion, partido: IdPartido): boolean {
  return postulacion.modo === 'fuera' && postulacion.formulas[partido] === 'sin-postular'
}

/** Todas las fórmulas que hay en un distrito, sea cual sea su modo. */
export function formulasEnDistrito(postulacion: Postulacion): TokenFormula[] {
  if (postulacion.modo === 'convenio') return postulacion.formula ? [postulacion.formula] : []
  if (postulacion.modo === 'fuera') {
    return Object.values(postulacion.formulas).filter(
      (d): d is TokenFormula => Boolean(d) && d !== 'sin-postular',
    )
  }
  return []
}

// ─── Proyección de ámbitos ──────────────────────────────────────────────────

/**
 * Qué clase de reglas corre un ámbito.
 *
 * - `tablero`: un conjunto con bloques propios. Le tocan las reglas que dependen
 *   de dónde cae cada distrito —bloques, liderazgo, blindaje, cuota indígena—.
 *   Hay uno para el convenio y uno por cada partido que postula fuera de él, y
 *   **no se acumulan entre sí**: es el artículo 28.8 de los Lineamientos.
 * - `consolidado`: las candidaturas **atribuidas** a un partido, dentro y fuera
 *   del convenio: las que sigló más las que postula por su cuenta. Le tocan las
 *   reglas de conteo —paridad general y cuota joven—, que el artículo 20.2 exige
 *   medir sobre ese universo unificado. No tiene bloques propios: sus distritos
 *   conservan los del tablero del que vienen, porque acumularlos sería justo lo
 *   que el 28.8 prohíbe.
 *
 * Ojo con la diferencia entre este ámbito y la *huella de participación* que
 * mide el umbral de RP: el consolidado cuenta lo siglado, la huella cuenta todo
 * el convenio. Postular no es siglar.
 */
export type TipoAmbito = 'tablero' | 'consolidado'

export interface Ambito {
  /** Texto que identifica el ámbito en el dictamen. */
  etiqueta: string
  tipo: TipoAmbito
  /** `null` solo en el tablero del convenio de una alianza. */
  partido: IdPartido | null
  /** Un tablero de distritos que el partido postula fuera del convenio. */
  fuera: boolean
  /**
   * Si este ámbito responde por su propio cincuenta por ciento de mujeres.
   *
   * No todos lo hacen, y el artículo 20 lo reparte de forma distinta según la
   * figura:
   *
   * - **Partido solo:** su registro, que son los quince (artículo 23.1).
   * - **Convenio de una alianza:** siempre. En coalición total «el resultado
   *   final de la coalición» debe garantizar el 50%; en parcial o flexible «el
   *   convenio deberá ser paritario en el total de los distritos que abarque»;
   *   en candidatura común se exige «sobre el total de las candidaturas
   *   postuladas de forma conjunta».
   * - **Integrante de una coalición total:** **no.** El 20.2 dice que ahí la
   *   paridad se verifica «exclusivamente» sobre el conjunto y que los partidos
   *   «podrán distribuir los géneros libremente» en los distritos que siglen.
   * - **Integrante de una coalición parcial o flexible, o de una candidatura
   *   común:** sí, sobre su registro consolidado.
   *
   * Los tableros de distritos fuera del convenio nunca lo hacen por su cuenta:
   * sus fórmulas se cuentan dentro del consolidado del partido.
   */
  paridadPropia: boolean
  /**
   * Si a este ámbito le aplican los bloques de competitividad.
   *
   * Falso por dos motivos distintos que conviene no confundir. Por derecho: el
   * artículo 23.2 exime a los partidos locales y a los nacionales de nuevo
   * registro, y el 29.2 lo repite para los locales. Por aritmética: ningún
   * integrante compitió en 2023-2024, así que no hay porcentaje con el que
   * ordenar. En los dos casos el tablero se presenta en orden ascendente de
   * distrito y no corren las cuatro reglas que cuelgan de la geometría.
   */
  conBloques: boolean
  distritos: readonly DistritoEvaluado[]
}

/**
 * Arma un tablero: aísla los distritos indicados, los ordena por el porcentaje
 * de quien los postula y les asigna posiciones y bloques **propios**.
 *
 * Es el artículo 27. Un partido que se queda con siete distritos fuera del
 * convenio no los evalúa en las posiciones 9 a 15 de su ranking de quince: los
 * renumera del 1 al 7 y los reparte en tres bloques de 3, 2 y 2.
 *
 * Aquí entran los criterios, y es el único sitio donde lo hacen: qué posiciones
 * cierra el artículo 28.2 depende de cómo se lea el punto V del artículo 27, y
 * de esa marca cuelgan después el rebote del arrastre y cuatro reglas.
 */
function proyectarTablero(
  distritos: readonly DistritoActivo[],
  integrantes: readonly IdPartido[],
  formulaDe: (distrito: DistritoActivo) => TokenFormula | null,
  criterios: Criterios,
): DistritoEvaluado[] {
  const porId = new Map(distritos.map((d) => [d.id_distrito, d]))
  // La exención del 23.2 es de cada partido. Una alianza no es ninguno de los
  // tres supuestos que enumera, así que su convenio conserva los bloques aunque
  // incluya a un partido exento; lo que decide entonces es si queda algún
  // porcentaje con el que ordenar, y de eso se encarga `integrarBloques`.
  const exento = integrantes.length === 1 && !aplicanBloques(integrantes[0])
  const competitividades = integrarBloques(
    porcentajesDe(integrantes, [...porId.keys()]),
    !exento,
  )
  const sinBloques = competitividades.every((c) => c.bloque === null)
  const blindadas = sinBloques
    ? new Set<number>()
    : new Set(posicionesBlindadasSegun(competitividades.length, criterios))

  return competitividades.map((comp) => {
    const distrito = porId.get(comp.id_distrito)!
    return {
      id_distrito: distrito.id_distrito,
      numero_romano: distrito.numero_romano,
      cabecera: distrito.cabecera,
      mayoria_indigena: distrito.mayoria_indigena,
      porcentaje: comp.porcentaje,
      posicion_rentabilidad: comp.posicion_rentabilidad,
      bloque: comp.bloque,
      esBlindada: blindadas.has(comp.posicion_rentabilidad),
      siglado: distrito.postulacion.modo === 'convenio' ? distrito.postulacion.partido : null,
      formula_asignada: formulaDe(distrito),
    }
  })
}

/** Si la proyección llegó a repartir bloques. Ver `Ambito.conBloques`. */
function conBloques(distritos: readonly DistritoEvaluado[]): boolean {
  return distritos.some((d) => d.bloque !== null)
}

function enConvenio(distritos: readonly DistritoActivo[], partido?: IdPartido): DistritoActivo[] {
  return distritos.filter(
    (d) =>
      d.postulacion.modo === 'convenio' && (!partido || d.postulacion.partido === partido),
  )
}

/**
 * Los distritos que la coalición dejó fuera del convenio.
 *
 * Con `partido`, solo aquellos en los que ese integrante sí postula. Un distrito
 * fuera del convenio es una decisión de cada quien: en una coalición parcial o
 * flexible es justo donde un partido puede quedarse sin contender, y el artículo
 * 27 integra los bloques con los distritos en los que **sí** se postula.
 */
function fueraDelConvenio(
  distritos: readonly DistritoActivo[],
  partido?: IdPartido,
): DistritoActivo[] {
  return distritos.filter(
    (d) =>
      d.postulacion.modo === 'fuera' &&
      (partido === undefined || !declinaPostular(d.postulacion, partido)),
  )
}

function formulaEnConvenio(distrito: DistritoActivo): TokenFormula | null {
  return distrito.postulacion.modo === 'convenio' ? distrito.postulacion.formula : null
}

function formulaIndividual(partido: IdPartido) {
  return (distrito: DistritoActivo): TokenFormula | null =>
    formulaIndividualDe(distrito.postulacion, partido)
}

function etiquetaAlianza(estado: EstadoSimulacion): string {
  const { postulante } = estado
  const siglas = postulante.integrantes.map(siglasDe)
  return siglas.length === 1 ? siglas[0] : `${postulante.modalidad} ${siglas.join('-')}`
}

/**
 * Ámbitos de evaluación de un estado.
 *
 * Un partido que compite solo produce dos: su tablero y su registro. La
 * separación parece redundante ahí, pero es la misma que en coalición y evita
 * que el dictamen mezcle "dónde están colocadas las mujeres" con "cuántas se
 * registraron", que son preguntas distintas.
 *
 * Los criterios llegan aquí con la lectura de la ley por omisión, como en toda
 * regla del motor. Quien ya los tenga en la mano debe pasarlos: dos proyecciones
 * del mismo tablero con criterios distintos marcarían distintas las posiciones
 * que el artículo 28.2 cierra, y la pantalla acabaría pintando cerrado un
 * distrito que el dictamen tiene por abierto.
 */
export function ambitosDe(
  estado: EstadoSimulacion,
  criterios: Criterios = CRITERIOS_LEY,
): Ambito[] {
  const { postulante, distritos } = estado
  const solo = postulante.integrantes.length === 1
  const alianza = etiquetaAlianza(estado)
  const huerfanos = fueraDelConvenio(distritos)

  // Coalición total: el convenio abarca todo y ningún integrante compite por su
  // cuenta. Es el único supuesto en que el artículo 20.2 releva a los partidos
  // de su paridad individual. La candidatura común no entra: el 20.3 exige las
  // dos, la del convenio y la de cada partido, sin importar el alcance.
  const coalicionTotal =
    !solo && postulante.modalidad === 'Coalición' && huerfanos.length === 0

  const tableroDelConvenio = proyectarTablero(
    enConvenio(distritos),
    postulante.integrantes,
    formulaEnConvenio,
    criterios,
  )

  const ambitos: Ambito[] = [
    {
      etiqueta: solo ? `${alianza} · tablero` : `${alianza} · convenio`,
      tipo: 'tablero',
      partido: solo ? postulante.integrantes[0] : null,
      fuera: false,
      paridadPropia: !solo,
      conBloques: conBloques(tableroDelConvenio),
      distritos: tableroDelConvenio,
    },
  ]

  for (const partido of postulante.integrantes) {
    // Sin distritos fuera del convenio no hay tablero individual que evaluar: la
    // coalición es total y el partido no compite solo en ningún lado.
    // Los suyos, no los de la coalición: los que este integrante no declinó.
    const suyos = fueraDelConvenio(distritos, partido)
    const propio = suyos.length
      ? proyectarTablero(suyos, [partido], formulaIndividual(partido), criterios)
      : []
    if (propio.length > 0) {
      ambitos.push({
        etiqueta: `${siglasDe(partido)} · postulaciones en lo individual`,
        tipo: 'tablero',
        partido,
        fuera: true,
        paridadPropia: false,
        conBloques: conBloques(propio),
        distritos: propio,
      })
    }

    const siglados = proyectarTablero(
      enConvenio(distritos, partido),
      postulante.integrantes,
      formulaEnConvenio,
      criterios,
    )
    ambitos.push({
      etiqueta: `${siglasDe(partido)} · paridad global`,
      tipo: 'consolidado',
      partido,
      fuera: false,
      paridadPropia: !coalicionTotal,
      conBloques: false,
      distritos: [...siglados, ...propio],
    })
  }

  return ambitos
}

// ─── Conteos ────────────────────────────────────────────────────────────────

export interface ConteoGenero {
  mujeres: number
  hombres: number
  asignadas: number
  sinAsignar: number
  total: number
}

/**
 * Cuenta por el género de la persona propietaria, que es quien encabeza la
 * fórmula. Los perfiles no binarios se cuentan como hombres.
 */
export function conteoGenero(distritos: readonly DistritoEvaluado[]): ConteoGenero {
  let mujeres = 0
  let hombres = 0
  for (const distrito of distritos) {
    const formula = distrito.formula_asignada
    if (!formula) continue
    if (esMujer(formula.propietario)) mujeres += 1
    else hombres += 1
  }
  const asignadas = mujeres + hombres
  return {
    mujeres,
    hombres,
    asignadas,
    sinAsignar: distritos.length - asignadas,
    total: distritos.length,
  }
}

export function distritoEnPosicion(
  distritos: readonly DistritoEvaluado[],
  posicion: number,
): DistritoEvaluado | undefined {
  return distritos.find((d) => d.posicion_rentabilidad === posicion)
}

// ─── Predicados de fórmula ──────────────────────────────────────────────────

/**
 * ¿Alcanza a esta fórmula la prohibición del artículo 28.2?
 *
 * Bajo la lectura de la ley basta con que **haya una mujer** en la fórmula, sea
 * propietaria o suplente: el 28.2 prohíbe «candidaturas del género femenino» sin
 * distinguir el cargo, y una suplente es una candidata registrada como tal.
 *
 * Es lo único que este criterio cambia. Los conteos de paridad siguen mirando a
 * quien encabeza, aquí y en todas las demás reglas.
 *
 * Vive con los demás predicados de fórmula y no junto a la regla que lo usa
 * porque lo consultan las dos puertas —el rebote del arrastre en `token.ts` y el
 * dictamen en `mr.ts`—, y esos dos módulos ya se importan en un sentido.
 */
export function alcanzaProhibicion(formula: TokenFormula, criterios: Criterios): boolean {
  if (esMujer(formula.propietario)) return true
  return criterios.alcanceMenorVotacion === 'candidatura' && esMujer(formula.suplente)
}

/** Ambos integrantes de hasta 30 años cumplidos al día de la elección. */
export function esFormulaJoven(formula: TokenFormula): boolean {
  return formula.propietario.esJoven && formula.suplente.esJoven
}

/**
 * Acción afirmativa que la fórmula acredita, o `null` si no acredita ninguna.
 *
 * Exige que ambos integrantes pertenezcan al mismo grupo. Usa la acción
 * afirmativa *efectiva*, por lo que una fórmula de dos personas no binarias
 * acredita diversidad sexual sin haberlo declarado.
 */
export function accionAfirmativaAcreditada(formula: TokenFormula): AccionAfirmativa | null {
  const propietario = accionAfirmativaEfectiva(formula.propietario)
  const suplente = accionAfirmativaEfectiva(formula.suplente)
  if (propietario === 'Ninguna') return null
  return propietario === suplente ? propietario : null
}

export function acreditaIndigena(formula: TokenFormula): boolean {
  return accionAfirmativaAcreditada(formula) === 'Indígena'
}

/**
 * Mínimo de fórmulas encabezadas por mujeres para alcanzar el 50%.
 *
 * Vive en `holgura.ts`, junto al cálculo de cuántas caben, y se reexporta aquí
 * porque es donde el resto del motor lo ha buscado siempre. Ahí tiene que estar
 * para que `holgura` no dependa de este archivo: la proyección de ámbitos va a
 * preguntarle qué posiciones cierra el artículo 28.2, y la dependencia solo
 * puede correr en un sentido.
 */
export { minimoMujeres } from './holgura'
