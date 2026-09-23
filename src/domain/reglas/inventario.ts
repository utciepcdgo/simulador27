import { FUNDAMENTOS } from './fundamentos'

/**
 * Qué evalúa el motor, regla por regla, y con qué fuerza lo exige.
 *
 * Vive aquí y no en un archivo de documentación porque un documento escrito a
 * mano envejece en silencio. Ya pasó: la «Matriz de Reglas a Evaluar» del
 * Technical Brief siguió afirmando durante meses que el Distrito XV obligaba a
 * postular una fórmula indígena, mucho después de que el motor corrigiera lo
 * contrario. Quien lo leyera como especificación habría pedido reponer un
 * comportamiento que impedía una postulación lícita.
 *
 * Siendo un dato, se puede probar contra el motor. `inventario.test.ts` exige
 * que **toda regla que el motor sea capaz de emitir aparezca aquí**, así que
 * añadir una regla sin documentarla rompe la suite. El documento de
 * `docs/reglas.md` es la impresión de esta lista, comparada en cada corrida.
 */

/** Con qué fuerza obliga la norma. */
export type Exigencia =
  /** Hay que cumplirla siempre. */
  | 'obligatoria'
  /** El articulado la ofrece; no cumplirla no es incumplir. */
  | 'optativa'
  /** Solo aplica en cierto supuesto: una alianza, un tablero completo, un bloque impar. */
  | 'condicionada'

export interface ReglaInventariada {
  /** El nombre exacto con el que el motor la emite. */
  regla: string
  ambito: 'Token' | 'MR' | 'RP'
  exigencia: Exigencia
  /** Qué pide, en una frase. */
  exige: string
  /** Sobre qué conjunto se mide. */
  universo: string
  fundamento: string
  /**
   * El motor emite una por bloque, con el nombre del bloque al final.
   *
   * Es la única regla que se multiplica, y la prueba de cobertura tiene que
   * saberlo para no exigir tres entradas idénticas.
   */
  porBloque?: true
  /** Lo que hay que saber y el articulado no dice de corrido. */
  nota?: string
}

export const INVENTARIO_REGLAS: readonly ReglaInventariada[] = [
  // ── Construcción de la fórmula ────────────────────────────────────────────
  {
    regla: 'Homogeneidad de género de la fórmula',
    ambito: 'Token',
    exigencia: 'obligatoria',
    exige:
      'Si la propietaria es mujer, la suplencia debe ser mujer. Si el propietario es hombre, la suplencia puede ser mujer o persona no binaria. Si es no binaria, la suplencia es libre.',
    universo: 'Cada fórmula, al crearse o al modificarse.',
    fundamento: FUNDAMENTOS.homogeneidadGenero,
    nota: 'Es la única regla que se verifica antes de colocar nada. El rebote la cita.',
  },

  // ── Integración ───────────────────────────────────────────────────────────
  {
    regla: 'Integración del convenio',
    ambito: 'MR',
    exigencia: 'condicionada',
    exige:
      'Que no queden distritos sin decidir y que lo siglado alcance al menos el veinticinco por ciento, que es el mínimo de la coalición flexible.',
    universo: 'Los quince distritos. Solo aplica a una alianza.',
    fundamento: FUNDAMENTOS.convenio,
  },
  {
    regla: 'Integración del tablero',
    ambito: 'MR',
    exigencia: 'condicionada',
    exige: 'Que el ámbito tenga al menos un distrito que evaluar.',
    universo: 'Cada tablero.',
    fundamento: FUNDAMENTOS.convenio,
    nota: 'Aparece cuando un tablero se queda sin distritos: sin ellos, ninguna otra regla puede decir nada de él.',
  },

  {
    regla: 'Bloques de competitividad',
    ambito: 'MR',
    exigencia: 'condicionada',
    exige:
      'Nada: es la exención. El ámbito se presenta en orden ascendente de distrito y no se le evalúan la paridad por bloque, el liderazgo de bloque, la mayoría en bloques impares ni la prohibición en distritos de menor votación.',
    universo:
      'Los partidos políticos locales y los nacionales de nuevo registro. También cualquier ámbito donde ningún integrante compitió en 2023-2024, porque entonces no hay porcentaje con el que ordenar.',
    fundamento: FUNDAMENTOS.bloquesInaplicables,
    nota: 'Aparece en el dictamen para decir que esas cuatro reglas no se evaluaron. Sin ella desaparecerían sin explicación y no se sabría si el motor las verificó o ni las miró.',
  },

  // ── Paridad ───────────────────────────────────────────────────────────────
  {
    regla: 'Paridad general de MR',
    ambito: 'MR',
    exigencia: 'obligatoria',
    exige: 'Al menos el cincuenta por ciento de fórmulas encabezadas por mujeres.',
    universo:
      'El convenio de una alianza, y el registro consolidado de cada partido: lo que sigla más lo que postula por su cuenta.',
    fundamento: FUNDAMENTOS.paridadGeneral,
  },
  {
    regla: 'Paridad global del partido',
    ambito: 'MR',
    exigencia: 'condicionada',
    exige:
      'Nada: es la exención. En coalición total la paridad se verifica exclusivamente sobre el conjunto, y los integrantes distribuyen los géneros libremente en lo que siglan.',
    universo: 'Cada integrante de una coalición total.',
    fundamento: FUNDAMENTOS.paridadGeneral,
    nota: 'Aparece en el dictamen para explicar por qué a ese partido no se le mide, en vez de que su sección desaparezca sin más.',
  },
  {
    regla: 'Paridad del bloque',
    ambito: 'MR',
    exigencia: 'obligatoria',
    exige:
      'Que ningún género supere el tope del bloque. En bloques de cinco distritos eso es el reparto 3-2 o 2-3.',
    universo: 'Cada uno de los tres bloques de competitividad del ámbito.',
    fundamento: FUNDAMENTOS.paridadBloques,
    porBloque: true,
  },
  {
    regla: 'Bloque encabezado por fórmula integrada por mujeres',
    ambito: 'MR',
    exigencia: 'condicionada',
    exige:
      'Que al menos uno de los tres bloques esté encabezado por una fórmula integrada por mujeres, mirando el distrito de mayor porcentaje de votación de cada bloque.',
    universo: 'Solo cuando los tres bloques se conforman con los quince distritos del Estado.',
    fundamento: FUNDAMENTOS.liderazgoBloque,
    nota: 'Cruza los dos sentidos de «encabezar»: mira tres distritos concretos, no cuenta mujeres.',
  },
  {
    regla: 'Mayoría de fórmulas encabezadas por mujeres en bloques impares',
    ambito: 'MR',
    exigencia: 'condicionada',
    exige:
      'Con los tres bloques impares, que al menos dos tengan mayoría de fórmulas encabezadas por mujeres. Con uno o dos bloques impares, que al menos uno de ellos la tenga.',
    universo: 'Los bloques de tamaño impar del ámbito.',
    fundamento: FUNDAMENTOS.mayoriaBloqueImpar,
    nota: 'En tableros de 5 y 11 distritos choca con la prohibición del 28.2 y ningún acomodo satisface las dos. Ver el criterio «aritmeticaImposible».',
  },
  {
    regla: 'Prohibición en distritos de menor porcentaje de votación',
    ambito: 'MR',
    exigencia: 'obligatoria',
    exige:
      'Que las posiciones de menor porcentaje de votación no lleven ninguna candidatura de mujer, ni como propietaria ni como suplente.',
    universo:
      'Los dos últimos distritos del bloque Baja, o el último cuando los bloques se integran con dos distritos cada uno.',
    fundamento: FUNDAMENTOS.blindajeBaja,
    nota: 'Que alcance a la suplencia es la lectura literal del «en ningún caso… candidaturas del género femenino». Ver el criterio «alcanceMenorVotacion».',
  },

  // ── Medidas compensatorias de mayoría relativa ────────────────────────────
  {
    regla: 'Medida compensatoria de personas jóvenes',
    ambito: 'MR',
    exigencia: 'obligatoria',
    exige:
      'Al menos una fórmula en la que tanto la persona propietaria como la suplente cuenten hasta con treinta años cumplidos al día de la elección.',
    universo:
      'Toda la alianza dentro del convenio. En los distritos que cada partido postula en lo individual, en proporción y «en lo que resulte aplicable».',
    fundamento: FUNDAMENTOS.cuotaJoven,
  },
  {
    regla: 'Medida compensatoria de personas indígenas',
    ambito: 'MR',
    exigencia: 'optativa',
    exige:
      'Nada. Los partidos «podrán» postular ahí una fórmula integrada por personas de origen étnico, y la de los demás distritos es «optativa más no limitativa».',
    universo: 'El Distrito XV, y cualquier otro distrito.',
    fundamento: FUNDAMENTOS.cuotaIndigena,
    nota: 'No puede incumplir. El Distrito XV **no es un espacio reservado**: admite cualquier fórmula, y no postular ahí la medida no es una falta. Impedir una postulación lícita sería el error más grave que esta herramienta puede cometer.',
  },

  // ── Representación proporcional ───────────────────────────────────────────
  {
    regla: 'Registro en once distritos para acceder a RP',
    ambito: 'RP',
    exigencia: 'obligatoria',
    exige:
      'Registrar candidaturas de mayoría relativa en cuando menos once de los quince distritos.',
    universo: 'Todo lo que el partido postula, siglado o no: postular no es siglar.',
    fundamento: FUNDAMENTOS.umbralRegistroRP,
  },
  {
    regla: 'Alternancia de género en RP',
    ambito: 'RP',
    exigencia: 'obligatoria',
    exige: 'Que los géneros se intercalen verticalmente, sin excepción.',
    universo: 'Las cinco posiciones de la Lista «A» de cada partido.',
    fundamento: FUNDAMENTOS.alternanciaRP,
  },
  {
    regla: 'Encabezado compensatorio de RP',
    ambito: 'RP',
    exigencia: 'obligatoria',
    exige:
      'Que la primera posición corresponda al género subrepresentado en la mayoría relativa de ese partido. Con equivalencia exacta, el partido decide.',
    universo: 'La Lista «A» de cada partido, contra su propio desempeño de mayoría relativa.',
    fundamento: FUNDAMENTOS.encabezadoCompensatorioRP,
    nota: 'Es el contrapeso: compensa en la lista lo que la mayoría relativa dejó desequilibrado.',
  },
  {
    regla: 'Medida compensatoria en la Lista "A"',
    ambito: 'RP',
    exigencia: 'obligatoria',
    exige:
      'Al menos una fórmula dentro de los tres primeros lugares que corresponda a personas con discapacidad permanente, de la diversidad sexual, adultas mayores o migrantes.',
    universo: 'Las tres primeras posiciones de la Lista «A» de cada partido.',
    fundamento: FUNDAMENTOS.accionAfirmativaRP,
    nota: 'La adscripción indígena **no** acredita esta medida: el artículo enumera cuatro grupos y no la incluye.',
  },
]
