import {nombreDe, siglasDe} from '../catalogo/partidos'
import {
  BLOQUES,
  posicionesCabezaDeBloque,
  tamanosDeBloque,
  TOTAL_DISTRITOS,
} from '../catalogo/rentabilidad'
import { esMujer } from '../genero'
import type { IdPartido, ResultadoRegla } from '../types'
import { alcanzaProhibicion, type Ambito } from './base'
import { CRITERIOS_LEY, type Criterios } from './criterios'
import { aplicanBloques } from './elegibilidad'
import {
  acreditaIndigena,
  conteoGenero,
  distritoEnPosicion,
  esFormulaJoven,
  minimoMujeres,
} from './base'
import { FUNDAMENTOS } from './fundamentos'

/** Distritos de MR que hay que registrar para tener derecho a RP. */
export const MINIMO_DISTRITOS_PARA_RP = 11

/**
 * Nombres de regla que emiten dos módulos: el dictamen desde `mr.ts` y el
 * rechazo del arrastre desde `token.ts`. Se comparten para que no puedan
 * divergir, porque el diálogo de rebote los concatena con ` + ` cuando dos
 * impedimentos concurren.
 */
export const REGLA_CABEZA_DE_BLOQUE = 'Bloque encabezado por fórmula integrada por mujeres'
export const REGLA_PROHIBICION_MENOR_VOTACION =
  'Prohibición en distritos de menor porcentaje de votación'
export const REGLA_MEDIDA_INDIGENA = 'Medida compensatoria de personas indígenas'

/**
 * Cómo se nombra la ubicación que prohíbe postular fórmulas encabezadas por
 * mujeres, según cuántas posiciones alcance en este ámbito.
 *
 * No siempre son dos. En un ámbito de tres, cuatro o cinco distritos el bloque
 * Baja tiene uno solo, y ahí «los dos últimos distritos» sería falso.
 */
function ubicacionProhibida(cuantas: number): string {
  return cuantas === 1
    ? 'está en el último distrito de menor porcentaje de votación'
    : 'está en los dos últimos distritos de menor porcentaje de votación'
}

/**
 * Paridad general: cuando menos la mitad de las fórmulas encabezadas por
 * mujeres.
 *
 * Se mide sobre el ámbito consolidado —lo que el partido registra dentro y fuera
 * del convenio, unificado—, que es lo que exige el artículo 20.2 de los
 * Lineamientos. Un partido que sigló 8 distritos y compite solo en 7 responde
 * por los 15 juntos: mínimo 8 mujeres.
 */
export function paridadGeneral(
  ambito: Ambito,
  criterios: Criterios = CRITERIOS_LEY,
): ResultadoRegla {
  const { mujeres, hombres, asignadas, sinAsignar, total } = conteoGenero(ambito.distritos)
  // Ver `Criterios.denominadorParidad`. Medido sobre lo registrado, el mínimo
  // equivale a exigir que las mujeres no sean menos que los hombres.
  const sobreRegistradas = criterios.denominadorParidad === 'registradas'
  const universo = sobreRegistradas ? asignadas : total
  const minimo = minimoMujeres(universo)
  const cumple = mujeres >= minimo
  // No basta con llenar los huecos: si aun ocupándolos todos con mujeres el
  // mínimo queda lejos, la reparación pasa por sustituir. Conviene decirlo antes
  // de que se acabe el tablero, no después.
  const bastaConLlenar = mujeres + sinAsignar >= minimo
  let mensaje: string
  if (sobreRegistradas) {
    const detalle = `${mujeres} de ${asignadas} candidatura(s) registrada(s) encabezada(s) por mujeres (mínimo ${minimo}); se mide sobre lo registrado y no sobre los ${total} distritos del ámbito.`
    mensaje = cumple
      ? detalle
      : `${detalle} Faltan ${minimo - mujeres} para alcanzarlo, ya sea registrando más fórmulas encabezadas por mujeres o sustituyendo alguna de las colocadas.`
  } else if (cumple) {
    mensaje = `${mujeres} de ${total} fórmulas encabezadas por mujeres (mínimo ${minimo}).`
  } else if (sinAsignar === 0) {
    mensaje = `El mínimo de ${minimo} fórmulas encabezadas por mujeres no se ha cumplido: hay ${mujeres} ${mujeres === 1 ? 'fórmula' : 'fórmulas'} de mujeres y ${hombres} de hombres. Es necesario sustituir candidaturas para garantizar la paridad global.`
  } else if (bastaConLlenar) {
    mensaje = `Faltan ${minimo - mujeres} fórmulas encabezadas por mujeres para alcanzar el mínimo de ${minimo}.`
  } else {
    mensaje = `Faltan ${minimo - mujeres} fórmulas encabezadas por mujeres para el mínimo de ${minimo}, y ${sinAsignar} distrito(s) sin asignar no bastan: habrá que sustituir alguna de las ya colocadas.`
  }
  return {
    regla: 'Paridad general de MR',
    ambito: 'MR',
    alcance: ambito.etiqueta,
    cumple,
    // Nunca irreparable: el incumplimiento de paridad se corrige sustituyendo
    // candidaturas del género sobrante, y el Instituto está obligado a fijar un
    // plazo improrrogable para ello antes de cancelar nada por sorteo. Lo que
    // cambia al llenarse el tablero no es si tiene arreglo, sino cuál: deja de
    // bastar con asignar y hay que reemplazar.
    gravedad: cumple ? undefined : sinAsignar > 0 && bastaConLlenar ? 'por-completar' : 'sustitucion',
    mensaje,
    fundamento_legal: FUNDAMENTOS.paridadGeneral,
  }
}

/**
 * Por qué un integrante de coalición total no responde por su propia paridad.
 *
 * Se emite en lugar de `paridadGeneral` y nunca incumple. Podría no emitirse
 * nada, pero entonces la sección del partido desaparecería del dictamen sin
 * explicación, y la regla del artículo 20.2 es lo bastante contraintuitiva como
 * para que valga la pena decirla en voz alta: el mismo partido, compitiendo
 * solo, sí tendría que llevar ocho de quince.
 */
function exencionParidadPropia(ambito: Ambito): ResultadoRegla {
  const { mujeres, hombres, total } = conteoGenero(ambito.distritos)
  const siglas = ambito.partido !== null ? siglasDe(ambito.partido) : 'El partido'
  return {
    regla: 'Paridad global del partido',
    ambito: 'MR',
    alcance: ambito.etiqueta,
    cumple: true,
    mensaje: `En coalición total la paridad se verifica exclusivamente sobre el conjunto de la coalición, así que ${siglas} distribuye libremente los géneros en los ${total} distritos que sigla: hoy lleva ${mujeres} ${mujeres === 1 ? 'encabezada' : 'encabezadas'} por mujeres y ${hombres} por ${hombres === 1 ? 'hombre' : 'hombres'}.`,
    fundamento_legal: FUNDAMENTOS.paridadGeneral,
  }
}

/**
 * Paridad de bloques: ningún género puede llevarse más de la mitad del bloque,
 * redondeando hacia arriba. En el bloque de cinco del ámbito completo eso es el
 * clásico 3-2; en uno de tres, 2-1; en uno de dos, 1-1.
 *
 * El máximo depende del tamaño del bloque, y el tamaño de cuántos distritos
 * tenga el ámbito: la integración parcial del artículo 27 reparte siete
 * distritos en 3-2-2, no en 5-5-5 con huecos.
 */
export function paridadBloques(ambito: Ambito): ResultadoRegla[] {
  const tamanos = tamanosDeBloque(ambito.distritos.length)
  return BLOQUES.map((bloque) => {
    const delBloque = ambito.distritos.filter((d) => d.bloque === bloque)
    const maximo = Math.ceil(tamanos[bloque] / 2)
    const { mujeres, hombres, sinAsignar } = conteoGenero(delBloque)
    const excede = mujeres > maximo || hombres > maximo
    const cumple = sinAsignar === 0 && !excede
    const generoExcedido = mujeres > maximo ? 'mujeres' : 'hombres'
    let mensaje: string
    if (delBloque.length === 0) {
      mensaje = `Este ámbito no postula en ningún distrito del bloque ${bloque}.`
    } else if (cumple) {
      mensaje = `Bloque ${bloque}: ${mujeres} fórmulas encabezadas por mujeres y ${hombres} por hombres, de ${delBloque.length} distrito(s).`
    } else if (excede) {
      mensaje = `El bloque ${bloque} ya tiene ${Math.max(mujeres, hombres)} fórmulas encabezadas por ${generoExcedido}; en un bloque de ${tamanos[bloque]} el máximo por género es ${maximo}.`
    } else {
      mensaje = `El bloque ${bloque} tiene ${sinAsignar} distrito(s) sin asignar.`
    }
    const resultado: ResultadoRegla = {
      regla: `Paridad del bloque ${bloque}`,
      ambito: 'MR',
      alcance: ambito.etiqueta,
      cumple,
      gravedad: cumple ? undefined : excede ? 'sustitucion' : 'por-completar',
      mensaje,
      fundamento_legal: FUNDAMENTOS.paridadBloques,
      implicados: delBloque.map((d) => d.id_distrito),
    }
    return resultado
  })
}

/**
 * Liderazgo de bloque (artículo 28.1): cuando menos una de las tres **cabezas de
 * bloque** —los distritos en las posiciones 1, 6 y 11— debe llevar fórmula
 * encabezada por mujer.
 *
 * El verbo «encabezar» tiene aquí dos sujetos que conviene no confundir:
 *
 * - **Encabezar una fórmula** es ser su propietario. Es una propiedad de la
 *   candidatura, no del territorio, y es lo que miran el 20.2, el 28.4 y el
 *   28.5.
 * - **Encabezar un bloque** es ocupar su distrito de mayor votación. Es una
 *   posición del ranking de rentabilidad, y por sí sola no dice nada del género.
 *
 * El 28.1 es el único que cruza los dos: pide una fórmula encabezada por mujer
 * *en la cabeza* de algún bloque. Por eso no cuenta cuántas mujeres hay en el
 * bloque —eso es el 28.4— sino que mira exactamente tres distritos. Un tablero
 * con once fórmulas de mujeres puede incumplirlo si las tres cabezas son
 * hombres.
 *
 * La norma condiciona la regla a que los tres bloques se conformen **con los
 * quince distritos del Estado**, así que solo corre en un tablero completo. En
 * los parciales la sustituye `mayoriaBloqueImpar`; ver `evaluarMR`.
 */
export function liderazgoBloque(ambito: Ambito): ResultadoRegla {
  const cabezas = posicionesCabezaDeBloque(ambito.distritos.length)
    .map((posicion) => distritoEnPosicion(ambito.distritos, posicion))
    .filter((d) => d !== undefined)
  if (cabezas.length === 0) {
    return {
      regla: REGLA_CABEZA_DE_BLOQUE,
      ambito: 'MR',
      alcance: ambito.etiqueta,
      cumple: true,
      mensaje: 'Este ámbito no postula en ninguna cabeza de bloque.',
      fundamento_legal: FUNDAMENTOS.liderazgoBloque,
    }
  }
  const conMujer = cabezas.filter((d) => d.formula_asignada && esMujer(d.formula_asignada.propietario))
  const vacias = cabezas.filter((d) => !d.formula_asignada)
  const cumple = conMujer.length > 0
  const nombrar = (lista: typeof cabezas) =>
    lista.map((d) => `${d.bloque} (distrito ${d.numero_romano})`).join(', ')
  let mensaje: string
  if (cumple) {
    mensaje = `La cabeza del bloque ${nombrar(conMujer.slice(0, 1))} lleva fórmula encabezada por mujer.`
  } else if (vacias.length > 0) {
    mensaje = `Ninguna cabeza de bloque lleva todavía fórmula encabezada por mujer; quedan ${vacias.length} por asignar.`
  } else {
    mensaje = `Las tres cabezas de bloque —${nombrar(cabezas)}— llevan fórmulas encabezadas por hombres. Basta cambiar una: no importa cuántas mujeres haya en el resto del bloque.`
  }
  return {
    regla: REGLA_CABEZA_DE_BLOQUE,
    ambito: 'MR',
    alcance: ambito.etiqueta,
    cumple,
    gravedad: cumple ? undefined : vacias.length > 0 ? 'por-completar' : 'sustitucion',
    mensaje,
    fundamento_legal: FUNDAMENTOS.liderazgoBloque,
    implicados: cabezas.map((d) => d.id_distrito),
  }
}

/**
 * Mayoría femenina en bloques impares (artículo 28, numerales 4 y 5).
 *
 * Los dos numerales son la misma regla con distinto cupo, y entre ambos cubren
 * cualquier reparto:
 *
 * | Bloques impares | Numeral | Deben tener mayoría femenina |
 * |---|---|---|
 * | 3 | 28.4 | dos de ellos |
 * | 2 ó 1 | 28.5 | uno de ellos |
 * | 0 | — | ninguno |
 *
 * La mayoría de un bloque es más de la mitad: tres en uno de cinco, dos en uno
 * de tres, una en uno de uno. Coincide con el techo que impone `paridadBloques`,
 * así que las dos reglas nunca se contradicen: un bloque impar con mayoría
 * femenina está exactamente en su máximo permitido.
 *
 * A diferencia del liderazgo de bloque (28.1), esta regla no está condicionada a
 * los quince distritos y corre en todos los tableros. En el completo se acumulan
 * las dos.
 */
export function mayoriaBloqueImpar(
  ambito: Ambito,
  criterios: Criterios = CRITERIOS_LEY,
): ResultadoRegla {
  const tamanos = tamanosDeBloque(ambito.distritos.length)
  const impares = BLOQUES.filter((bloque) => tamanos[bloque] % 2 === 1)
  const base = {
    regla: 'Mayoría de fórmulas encabezadas por mujeres en bloques impares',
    ambito: 'MR' as const,
    alcance: ambito.etiqueta,
    fundamento_legal: FUNDAMENTOS.mayoriaBloqueImpar,
  }
  if (impares.length === 0) {
    return {
      ...base,
      cumple: true,
      mensaje: 'Ningún bloque de este ámbito tiene un número impar de distritos.',
    }
  }

  const requeridos = impares.length === 3 ? 2 : 1
  const conteos = impares.map((bloque) => {
    const delBloque = ambito.distritos.filter((d) => d.bloque === bloque)
    const { mujeres, sinAsignar } = conteoGenero(delBloque)
    // Mayoría estricta: más de la mitad del bloque.
    const necesarias = Math.floor(tamanos[bloque] / 2) + 1
    // Techo del bloque: la prohibición del 28.2 cierra posiciones, y ninguna
    // fórmula encabezada por mujer puede ocuparlas por mucho que se reacomode.
    const admisibles = delBloque.filter((d) => !d.esBlindada).length
    return { bloque, mujeres, sinAsignar, necesarias, admisibles }
  })

  const logrados = conteos.filter((c) => c.mujeres >= c.necesarias)
  const posibles = conteos.filter((c) => c.mujeres + c.sinAsignar >= c.necesarias)
  // No es que falte colocar: es que no cabe. Ocurre en los ámbitos de 5 y 11
  // distritos, donde el bloque bajo es el único impar y el 28.2 se lo come.
  const cabenEnAlgunBloque = conteos.filter((c) => c.admisibles >= c.necesarias)
  const imposiblePorGeometria = cabenEnAlgunBloque.length < requeridos
  const cumple = logrados.length >= requeridos
  const alcanzable = posibles.length >= requeridos

  if (imposiblePorGeometria && criterios.aritmeticaImposible === 'inaplicable') {
    return {
      ...base,
      cumple: true,
      mensaje: `No aplicable, conforme al artículo 27, numeral 1, punto V: en un ámbito de ${ambito.distritos.length} distritos la prohibición del artículo 28.2 ocupa las posiciones que harían falta para la mayoría exigida, así que ningún acomodo la satisface.`,
    }
  }
  const exigencia = impares
    .map((bloque) => `${bloque} (${Math.floor(tamanos[bloque] / 2) + 1} de ${tamanos[bloque]})`)
    .join(', ')

  return {
    ...base,
    cumple,
    gravedad: cumple ? undefined : alcanzable ? 'por-completar' : 'sustitucion',
    mensaje: cumple
      ? `${logrados.length} de los ${impares.length} bloque(s) impar(es) tiene(n) mayoría femenina: ${logrados.map((c) => `${c.bloque} con ${c.mujeres}`).join(', ')}.`
      : `${impares.length === 3 ? 'Los tres bloques son impares, así que dos deben' : `Hay ${impares.length} bloque(s) impar(es), así que uno debe`} integrarse por mayoría de fórmulas encabezadas por mujeres. Mayoría exigida: ${exigencia}. Hoy la tiene(n) ${logrados.length}.${imposiblePorGeometria ? ' Ningún acomodo lo satisface: la prohibición del artículo 28.2 ocupa las posiciones que harían falta.' : ''}`,
    implicados: impares.flatMap((bloque) =>
      ambito.distritos.filter((d) => d.bloque === bloque).map((d) => d.id_distrito),
    ),
  }
}

/**
 * Blindaje de rentabilidad baja: las dos posiciones de menor votación **del
 * ámbito** no admiten fórmulas encabezadas por mujeres. Los perfiles no binarios
 * sí caben, porque para paridad cuentan como hombres.
 */
export function blindajeBaja(
  ambito: Ambito,
  criterios: Criterios = CRITERIOS_LEY,
): ResultadoRegla {
  const alcanzaSuplencia = criterios.alcanceMenorVotacion === 'candidatura'
  const cargo = alcanzaSuplencia ? 'candidaturas de mujeres' : 'fórmulas encabezadas por mujeres'
  const blindadas = ambito.distritos.filter((d) => d.esBlindada)
  const infractores = blindadas.filter(
    (d) => d.formula_asignada && alcanzaProhibicion(d.formula_asignada, criterios),
  )
  const cumple = infractores.length === 0
  const posiciones = blindadas.map((d) => d.posicion_rentabilidad).join(' y ')
  let mensaje: string
  if (!cumple) {
    mensaje = `Distrito ${infractores.map((d) => d.numero_romano).join(', ')}: ${ubicacionProhibida(blindadas.length)} y en ningún caso admite ${cargo}.`
  } else if (blindadas.length === 0 && tamanosDeBloque(ambito.distritos.length).Baja === 0) {
    mensaje = `El bloque Baja de este ámbito está vacío, así que la prohibición es inoperante: admite ${cargo} en cualquiera de sus posiciones.`
  } else if (blindadas.length === 0) {
    // El bloque Baja sí existe: la prohibición se graduó a cero. Decir aquí que
    // el bloque está vacío sería falso, y dejaría al dictamen afirmando que no
    // hay nada que proteger justo donde se decidió no proteger nada.
    mensaje = `En un ámbito de ${ambito.distritos.length} distritos la prohibición no alcanza a ninguna posición: aplicarla dejaría al bloque Baja sin composición posible, y el artículo 27, numeral 1, punto V manda cumplir estos criterios «en proporción al número de distritos que integre cada bloque, y en lo que resulte aplicable».`
  } else if (blindadas.length === 1) {
    mensaje = `La posición de rentabilidad ${posiciones} no lleva ${alcanzaSuplencia ? 'ninguna candidatura de mujer' : 'fórmula encabezada por mujer'}.`
  } else {
    mensaje = `Las posiciones de rentabilidad ${posiciones} no llevan ${cargo}.`
  }
  return {
    regla: REGLA_PROHIBICION_MENOR_VOTACION,
    ambito: 'MR',
    alcance: ambito.etiqueta,
    cumple,
    gravedad: cumple ? undefined : 'sustitucion',
    mensaje,
    fundamento_legal: FUNDAMENTOS.blindajeBaja,
    implicados: infractores.map((d) => d.id_distrito),
  }
}

/**
 * Cuántas fórmulas de personas jóvenes exige un tablero.
 *
 * **En el convenio, una.** El artículo 53.1 enlista a las coaliciones y
 * candidaturas comunes como sujetos obligados, no solo a los partidos, así que
 * la alianza cumple *como entidad*: una sola fórmula joven libera a todos sus
 * integrantes en ese tablero. Es el contraste deliberado con el artículo 54, que
 * para la Lista "A" exige a los partidos «de manera individual».
 *
 * **Fuera del convenio, la proporción.** El artículo 27.1.V pide cumplir la medida
 * «en proporción al número de distritos que integre cada bloque, y en lo que
 * resulte aplicable». Una fórmula por cada quince distritos, redondeada: el
 * umbral cae en ocho, más de la mitad. Por debajo de eso la cuota es
 * matemáticamente inaplicable, que es a lo que apunta la última frase.
 *
 * Sin esta segunda mitad, un partido metería cuatro distritos en un convenio
 * flexible con una fórmula joven y quedaría liberado de los once que postula
 * solo. Con ella, esos once le exigen la suya.
 */
export function minimoJovenes(ambito: Ambito): number {
  if (!ambito.fuera) return 1
  return Math.round(ambito.distritos.length / TOTAL_DISTRITOS)
}

/** Cuota joven: fórmulas con ambos integrantes de hasta 30 años. */
export function cuotaJoven(ambito: Ambito): ResultadoRegla {
  const minimo = minimoJovenes(ambito)
  const jovenes = ambito.distritos.filter(
    (d) => d.formula_asignada && esFormulaJoven(d.formula_asignada),
  )
  const sinAsignar = ambito.distritos.filter((d) => !d.formula_asignada).length
  const base = {
    regla: 'Medida compensatoria de personas jóvenes',
    ambito: 'MR' as const,
    alcance: ambito.etiqueta,
    fundamento_legal: FUNDAMENTOS.cuotaJoven,
    implicados: jovenes.map((d) => d.id_distrito),
  }

  if (minimo === 0) {
    return {
      ...base,
      cumple: true,
      mensaje: `No aplicable: ${ambito.distritos.length} de 15 distritos no alcanzan la proporción de una fórmula, conforme al artículo 27, numeral 1, punto V.`,
    }
  }

  const cumple = jovenes.length >= minimo
  const alcanzable = jovenes.length + sinAsignar >= minimo
  const faltan = minimo - jovenes.length
  let mensaje: string
  if (cumple) {
    mensaje = `${jovenes.length} fórmula(s) integrada(s) por personas jóvenes (mínimo ${minimo}).`
  } else if (alcanzable) {
    mensaje =
      faltan === 1
        ? 'Falta 1 fórmula integrada por personas jóvenes.'
        : `Faltan ${faltan} fórmulas integradas por personas jóvenes.`
  } else {
    mensaje =
      sinAsignar === 0
        ? `Hay ${jovenes.length} de ${minimo} fórmula(s) integrada(s) por personas jóvenes y ningún distrito sin asignar: es necesario sustituir candidaturas.`
        : `Faltan ${faltan} y los ${sinAsignar} distrito(s) sin asignar no bastan: habrá que sustituir alguna de las fórmulas ya colocadas.`
  }
  return {
    ...base,
    cumple,
    gravedad: cumple ? undefined : alcanzable ? 'por-completar' : 'sustitucion',
    mensaje,
  }
}

/**
 * Medida compensatoria de personas indígenas en el Distrito XV: **optativa**.
 *
 * El artículo 56.1 dice que los partidos «podrán» postular ahí una fórmula
 * integrada por personas de origen étnico, y el 56.2 la califica de «optativa
 * más no limitativa». No es un espacio reservado ni un requisito, así que esta
 * regla **nunca incumple**: informa si la medida se tomó y no la exige.
 *
 * Se conserva en el dictamen porque es el único lugar donde la herramienta dice
 * que ese distrito es el de mayor población indígena. Callarlo sería tan
 * inexacto como exigirlo.
 *
 * Se cruza con la prohibición del 28.2: para PAN y MC el Distrito XV cae en la
 * posición 14, donde no cabe fórmula encabezada por mujer. El mensaje lo
 * advierte para que la interacción se entienda.
 */
export function cuotaIndigena(ambito: Ambito): ResultadoRegla {
  const conMedida = ambito.distritos.filter((d) => d.mayoria_indigena)
  const base = {
    regla: REGLA_MEDIDA_INDIGENA,
    ambito: 'MR' as const,
    alcance: ambito.etiqueta,
    // Optativa: no hay estado de incumplimiento posible.
    cumple: true,
    fundamento_legal: FUNDAMENTOS.cuotaIndigena,
  }
  if (conMedida.length === 0) {
    return { ...base, mensaje: 'El Distrito XV no está en este ámbito.' }
  }
  const acreditadas = conMedida.filter(
    (d) => d.formula_asignada && acreditaIndigena(d.formula_asignada),
  )
  const blindado = conMedida.some((d) => d.esBlindada)
  const aviso = blindado
    ? ` Además ${ubicacionProhibida(ambito.distritos.filter((d) => d.esBlindada).length)}, por lo que tampoco admite fórmula encabezada por mujer.`
    : ''
  const romanos = conMedida.map((d) => d.numero_romano).join(', ')
  return {
    ...base,
    mensaje:
      acreditadas.length > 0
        ? `Distrito ${romanos}: fórmula integrada por personas indígenas acreditada.${aviso}`
        : `Distrito ${romanos}: es el de mayor población indígena y postular ahí una fórmula integrada por personas indígenas es optativo, no un requisito.${aviso}`,
    implicados: conMedida.map((d) => d.id_distrito),
  }
}

/**
 * Umbral de registro para RP: hay que registrar candidaturas de mayoría relativa
 * en cuando menos once distritos para tener derecho a la asignación de
 * representación proporcional.
 *
 * Se mide sobre la **huella de participación** del partido, no sobre lo que
 * sigló. Postular y siglar son cosas distintas: quien firma un convenio postula
 * en todos los distritos que el convenio abarca, y el siglado solo decide a
 * quién se atribuyen los votos, el financiamiento y la Lista "B". Un partido que
 * sigló seis dentro de un convenio de doce y postula tres por su cuenta acredita
 * quince, no nueve.
 *
 * Medirlo sobre lo siglado hacía la regla insatisfacible —ningún integrante de
 * una coalición repartida llega solo a once— y bloqueaba el dictamen para
 * siempre.
 */
export function umbralRegistroRP(
  ambitos: readonly Ambito[],
  partido: IdPartido,
): ResultadoRegla {
  const conFormula = (ambito?: Ambito) =>
    ambito ? ambito.distritos.filter((d) => d.formula_asignada).length : 0

  const siglas = siglasDe(partido)
  const nombrePartido = nombreDe(partido)
  const convenio = ambitos.find((a) => a.tipo === 'tablero' && !a.fuera)
  const propios = ambitos.find((a) => a.tipo === 'tablero' && a.fuera && a.partido === partido)
  const enConvenio = conFormula(convenio)
  const individuales = conFormula(propios)
  const registradas = enConvenio + individuales
  const cumple = registradas >= MINIMO_DISTRITOS_PARA_RP
  const desglose = propios
    ? `${enConvenio} por convenio y ${individuales} por su cuenta`
    : `${enConvenio} por convenio`

  return {
    regla: 'Registro en once distritos para acceder a RP',
    ambito: 'RP',
    alcance: `${siglas} · Lista "A"`,
    cumple,
    gravedad: cumple ? undefined : 'por-completar',
    mensaje:
      (cumple
        ? `${nombrePartido} postula en ${registradas} distritos (${desglose}); el mínimo para RP es ${MINIMO_DISTRITOS_PARA_RP}.`
        : `${nombrePartido} postula en ${registradas} distritos (${desglose}); faltan ${MINIMO_DISTRITOS_PARA_RP - registradas} para el mínimo de ${MINIMO_DISTRITOS_PARA_RP}.`) +
      ' Se cuentan todos los distritos que abarca el convenio, con independencia del siglado.',
    fundamento_legal: FUNDAMENTOS.umbralRegistroRP,
  }
}

/**
 * Reglas de MR aplicables a un ámbito, según su clase.
 *
 * Las que dependen del conjunto de distritos —bloques, liderazgo, blindaje,
 * cuotas joven e indígena— corren en cada **tablero** por separado y no se
 * acumulan entre sí: el convenio con el ranking de la alianza, y el de cada
 * partido con el suyo. La paridad general corre sobre el **consolidado** de cada
 * partido, que unifica lo que sigló y lo que postula por su cuenta.
 *
 * La cuota joven está en el tablero y no en el consolidado porque su sujeto
 * obligado es la coalición, no el partido: ver `minimoJovenes`.
 *
 * El umbral de RP no está aquí: no se mide sobre lo siglado sino sobre la huella
 * de participación del partido. Ver `umbralRegistroRP`.
 */
/**
 * Por qué este tablero no lleva bloques de competitividad.
 *
 * Aparece en el dictamen en lugar de las cuatro reglas que no corren. Una regla
 * que se esfuma sin decirlo dejaría a quien lee el dictamen sin saber si el
 * simulador la verificó y pasó, o si ni siquiera la miró.
 */
function exencionDeBloques(ambito: Ambito): ResultadoRegla {
  const suyo = ambito.partido !== null ? siglasDe(ambito.partido) : null
  const porDerecho = suyo !== null && !aplicanBloques(ambito.partido!)
  return {
    regla: 'Bloques de competitividad',
    ambito: 'MR',
    alcance: ambito.etiqueta,
    cumple: true,
    mensaje: porDerecho
      ? `Los bloques de competitividad no le aplican a ${suyo}, así que sus ${ambito.distritos.length} distritos se presentan en orden ascendente y no se le evalúan la paridad por bloque, el liderazgo de bloque, la mayoría en bloques impares ni la prohibición en distritos de menor votación.`
      : `Ningún integrante de este ámbito compitió en el Proceso Electoral Local 2023-2024, así que no hay porcentaje de votación con el que ordenar los distritos. Se presentan en orden ascendente y no se evalúan las reglas que dependen de los bloques.`,
    fundamento_legal: FUNDAMENTOS.bloquesInaplicables,
    implicados: ambito.distritos.map((d) => d.id_distrito),
  }
}

export function evaluarMR(
  ambito: Ambito,
  criterios: Criterios = CRITERIOS_LEY,
): ResultadoRegla[] {
  if (ambito.tipo === 'consolidado') {
    return [
      ambito.paridadPropia ? paridadGeneral(ambito, criterios) : exencionParidadPropia(ambito),
    ]
  }
  if (ambito.distritos.length === 0) {
    return [
      {
        regla: 'Integración del tablero',
        ambito: 'MR',
        alcance: ambito.etiqueta,
        cumple: false,
        gravedad: 'por-completar',
        mensaje: 'Este tablero todavía no tiene distritos asignados en el convenio.',
        fundamento_legal: FUNDAMENTOS.convenio,
      },
    ]
  }
  // Sin bloques caen las cuatro reglas que cuelgan de la geometría del tablero.
  // No desaparecen en silencio: `exencionDeBloques` ocupa su sitio y explica por
  // qué, que es la misma decisión que se tomó con la paridad de los integrantes
  // de una coalición total.
  if (!ambito.conBloques) {
    return [
      ...(ambito.paridadPropia ? [paridadGeneral(ambito, criterios)] : []),
      exencionDeBloques(ambito),
      cuotaJoven(ambito),
      cuotaIndigena(ambito),
    ]
  }
  // El 28.1 se condiciona a que los tres bloques se conformen con los quince
  // distritos del Estado; el 28.4 y el 28.5 no, así que corren siempre. En el
  // tablero completo se acumulan las dos exigencias.
  const completo = ambito.distritos.length === TOTAL_DISTRITOS
  return [
    // El convenio de una alianza responde por su propio 50%; el tablero de un
    // partido solo no, porque lo mide su registro consolidado sobre los mismos
    // quince distritos y saldría dos veces.
    ...(ambito.paridadPropia ? [paridadGeneral(ambito, criterios)] : []),
    ...paridadBloques(ambito),
    mayoriaBloqueImpar(ambito, criterios),
    ...(completo ? [liderazgoBloque(ambito)] : []),
    blindajeBaja(ambito, criterios),
    cuotaJoven(ambito),
    cuotaIndigena(ambito),
  ]
}
