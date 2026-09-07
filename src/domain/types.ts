import type { IdPartido } from './catalogo/partidos'

export type { IdPartido }

// ─────────────────────────────────────────────────────────────────────────────
// Catálogo estático
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Distrito como hecho geográfico. A diferencia del brief §3, `bloque` y
 * `posicion_rentabilidad` NO viven aquí: dependen del partido o coalición que
 * postula, no del distrito. Y `mayoria_indigena` es propiedad del distrito,
 * igual para todos los partidos, por lo que se declara una sola vez.
 */
export interface Distrito {
  id_distrito: number
  numero_romano: string
  cabecera: string
  /**
   * El Distrito XV: el que se conforma con los municipios de mayor porcentaje
   * de población indígena (artículo 6.2).
   *
   * Nombra un hecho del distrito, **no una obligación**. El artículo 55.1 dice
   * que los partidos «procurarán» postular ahí una fórmula integrada por
   * personas de origen étnico, y el 55.2 la califica de «optativa más no
   * limitativa». No es un espacio reservado: cualquier fórmula cabe.
   */
  mayoria_indigena: boolean
}

/** Porcentaje individual del PEL 2023-2024 para un partido en un distrito. */
export interface RegistroVotacion {
  partido: IdPartido
  id_distrito: number
  porcentaje: number
  votos: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Competitividad
// ─────────────────────────────────────────────────────────────────────────────

export type Bloque = 'Alta' | 'Media' | 'Baja'

/**
 * Competitividad de un distrito para un postulante concreto (un partido solo o
 * una alianza). `bloque` se deriva de `posicion_rentabilidad`; no es un dato
 * independiente que pueda contradecirla.
 */
export interface Competitividad {
  id_distrito: number
  porcentaje: number
  posicion_rentabilidad: number
  bloque: Bloque
}

/**
 * Quién postula: un partido individual o una alianza. La regla del Consejo
 * General es la misma en ambos casos —sumar porcentajes individuales del PEL
 * 2023-2024— por lo que un partido solo es el caso de un integrante.
 */
export interface Postulante {
  integrantes: readonly IdPartido[]
  modalidad: 'Individual' | 'Coalición' | 'Candidatura Común'
}

// ─────────────────────────────────────────────────────────────────────────────
// Perfiles y fórmulas (Tokens anónimos: nunca nombres)
// ─────────────────────────────────────────────────────────────────────────────

export type Genero = 'Mujer' | 'Hombre' | 'No Binario'

export type AccionAfirmativa =
  | 'Ninguna'
  | 'Indígena'
  | 'Discapacidad'
  | 'Diversidad Sexual'
  | 'Adulto Mayor'
  | 'Migrante'

/** Género con el que un perfil cuenta para paridad. Ver `generoParaParidad`. */
export type GeneroParidad = 'Mujer' | 'Hombre'

export interface PerfilCandidato {
  genero: Genero
  /** Hasta 30 años cumplidos al día de la elección. */
  esJoven: boolean
  accionAfirmativa: AccionAfirmativa
}

export interface TokenFormula {
  id: string
  propietario: PerfilCandidato
  suplente: PerfilCandidato
}

// ─────────────────────────────────────────────────────────────────────────────
// Estado dinámico del tablero
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Qué se decidió en la Fase 1 sobre un distrito.
 *
 * Estar fuera del convenio no es estar sin decidir: es la decisión de que cada
 * integrante compita ahí **por su cuenta**, con su propia fórmula y su propia
 * competitividad. De ahí que las fórmulas sean un mapa por partido y no una
 * sola. Es lo que convierte a una coalición en parcial o flexible.
 *
 * `sin-postular` es la postulación parcial del artículo 27: el partido decide no
 * competir ahí. No es un distrito vacío a la espera de fórmula —eso es
 * `sin-decidir`—, sino uno que queda **fuera del ámbito**, de modo que no cuenta
 * para el reordenamiento por porcentaje, ni para el reparto en bloques, ni para
 * ninguna de las reglas que se miden sobre ellos.
 *
 * Se modela como unión y no como campos sueltos porque los cuatro modos son
 * excluyentes: no existe un distrito que tenga a la vez fórmula de convenio y
 * fórmulas individuales, y el tipo no debe permitir escribirlo.
 */
/**
 * Lo que un integrante decide en un distrito que la coalición dejó fuera del
 * convenio, donde cada quien postula por su cuenta.
 *
 * Sin entrada es «sin decidir», la fórmula es «postula esto» y `'sin-postular'`
 * es la negativa del artículo 27. Que la negativa sea un valor del mismo hueco y
 * no una lista aparte impide el estado imposible: un partido no puede a la vez
 * declinar el distrito y tener una fórmula puesta en él.
 */
export type PostulacionIndividual = TokenFormula | 'sin-postular'

export type Postulacion =
  | { modo: 'sin-decidir' }
  | { modo: 'sin-postular' }
  | { modo: 'convenio'; partido: IdPartido; formula: TokenFormula | null }
  | { modo: 'fuera'; formulas: Readonly<Partial<Record<IdPartido, PostulacionIndividual>>> }

/**
 * Distrito en el tablero. La `Competitividad` que trae es la del postulante como
 * alianza: sirve para negociar el convenio. Los distritos que quedan fuera de él
 * tienen además una competitividad distinta por cada partido, que se calcula al
 * proyectar los ámbitos y no se almacena aquí.
 */
export interface DistritoActivo extends Distrito, Competitividad {
  postulacion: Postulacion
}

/**
 * Un distrito tal como lo ve un ámbito de evaluación: con la competitividad de
 * ese postulante en concreto y la única fórmula que le corresponde ahí.
 *
 * Es lo que consumen las reglas. Un distrito fuera del convenio se proyecta una
 * vez por cada partido que lo postula, y cada proyección puede caer en un bloque
 * distinto.
 */
export interface DistritoEvaluado extends Distrito, Competitividad {
  formula_asignada: TokenFormula | null
  /**
   * Si la posición es de las dos de menor votación **de su ámbito**. Se resuelve
   * al proyectar porque depende del tamaño del ámbito, que el distrito por sí
   * solo no conoce.
   */
  esBlindada: boolean
  /**
   * Partido al que el convenio atribuye el distrito, o `null` si el distrito
   * quedó fuera del convenio —ahí cada integrante postula por su cuenta y no hay
   * nada que siglar—.
   *
   * Se arrastra desde la postulación en vez de derivarse, porque no se deduce de
   * ningún otro dato del distrito: el siglado es una decisión de la negociación,
   * y es la que decide a quién se atribuyen los votos, el financiamiento y la
   * Lista "B".
   */
  siglado: IdPartido | null
}

/** Lista "A" de Representación Proporcional: 5 posiciones, por partido. */
export interface ListaRP {
  partido: IdPartido
  posiciones: readonly (TokenFormula | null)[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Resultado de validación
// ─────────────────────────────────────────────────────────────────────────────

export type AmbitoRegla = 'Token' | 'MR' | 'RP'

/**
 * Qué hay que hacer para corregir un requisito incumplido.
 *
 * - `por-completar`: faltan asignaciones. El requisito todavía no está
 *   contradicho; solo no se ha terminado de postular.
 * - `sustitucion`: lo que ya está colocado contradice el requisito, así que
 *   llenar los huecos no lo arregla: hay que reemplazar alguna fórmula.
 *
 * **Ninguno de los dos es irreparable, y por eso no existe un nivel que lo
 * afirme.** Frente a un incumplimiento, el Instituto está obligado a fijar al
 * partido un plazo improrrogable para sustituir candidaturas, y solo si no lo
 * hace procede al sorteo de cancelación. Un tablero lleno no cierra esa puerta:
 * cambia la vía de reparación, que deja de ser asignar y pasa a ser sustituir.
 *
 * El nivel severo se llamaba `infraccion` y el motor lo asignaba cuando ya no
 * quedaban distritos libres. Eran dos errores en uno: el nombre invocaba el
 * régimen sancionador, y el criterio suponía que la única reparación posible es
 * añadir.
 */
export type GravedadRegla = 'por-completar' | 'sustitucion'

export interface ResultadoRegla {
  regla: string
  ambito: AmbitoRegla
  /** Etiqueta del ámbito evaluado: la alianza completa o un partido siglado. */
  alcance: string
  cumple: boolean
  /** Solo presente cuando `cumple` es false. */
  gravedad?: GravedadRegla
  /** Texto que ve la persona usuaria en el AlertDialog. */
  mensaje: string
  /** Cita legal o del acuerdo que fundamenta la regla. */
  fundamento_legal: string
  /** `id_distrito` en MR, número de posición (1-5) en RP. */
  implicados?: readonly number[]
  /**
   * Partidos a los que corresponde el ámbito evaluado.
   *
   * Es del mismo orden que `implicados`: metadato para que la interfaz pueda
   * señalar de qué habla el resultado —ahí, acompañar el rótulo con los
   * emblemas— sin volver a deducirlo del texto de `alcance`.
   */
  partidos?: readonly IdPartido[]
}

/** Todo lo que el motor necesita para emitir un dictamen. */
export interface EstadoSimulacion {
  postulante: Postulante
  distritos: readonly DistritoActivo[]
  listasRP: readonly ListaRP[]
}
