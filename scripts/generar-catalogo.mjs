// Genera src/domain/catalogo/{partidos,distritos,votacion}.ts desde el CSV aprobado.
// Ejecutar con: pnpm catalogo:generar
// NO editar los archivos generados a mano.
import fs from 'node:fs'
import path from 'node:path'

const RAIZ = path.resolve(import.meta.dirname, '..')
const CSV = path.join(RAIZ, 'data/sirc-bloques-diputaciones-PEL-2026-2027.csv')
const CSV_PARTIDOS = path.join(RAIZ, 'data/partidos-PEL-2026-2027.csv')
const SALIDA = path.join(RAIZ, 'src/domain/catalogo')

/** Host de los emblemas oficiales. El archivo se llama como las siglas. */
const EMBLEMAS = 'https://s3.us-east-1.amazonaws.com/static.appsiepcdurango.mx/emblemas'

const ROMANOS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
  'XI', 'XII', 'XIII', 'XIV', 'XV']

/** Único distrito con obligación de fórmula indígena (brief §6.B). */
const DISTRITO_INDIGENA = 15

const NL = String.fromCharCode(10)

// --- Registro de partidos: el padrón vigente, no solo los que tienen historial ---
const registro = fs.readFileSync(CSV_PARTIDOS, 'utf8').replace(/^\uFEFF/, '').trim()
  .split(/\r?\n/).slice(1)
  .map((linea) => {
    const [id, siglas, nombre] = linea.split(',')
    return { id: Number(id), siglas: siglas.trim(), nombre: nombre.trim() }
  })
  .sort((a, b) => a.id - b.id)

registro.forEach(({ id, siglas }, i) => {
  if (id !== i + 1) {
    throw new Error(`El registro debe numerarse de 1 en adelante sin huecos; ${siglas} tiene el id ${id} en la posición ${i + 1}`)
  }
})
const duplicadas = registro.length !== new Set(registro.map((r) => r.siglas)).size
if (duplicadas) throw new Error('Hay siglas repetidas en el registro de partidos')

const idPorSiglas = new Map(registro.map((r) => [r.siglas, r.id]))

const filas = fs.readFileSync(CSV, 'utf8').trim().split(/\r?\n/).slice(1)
  .map((linea) => {
    const [idPartido, partido, distrito, cabecera, votos, porcentaje, origen] = linea.split(',')
    return {
      idPartido: Number(idPartido),
      partido,
      distrito: Number(distrito),
      cabecera,
      votos: Number(votos),
      porcentaje: Number(porcentaje),
      origen,
    }
  })

// --- Validaciones de integridad: fallar ruidosamente, no generar basura ---
const partidos = [...new Set(filas.map((f) => f.partido))]
for (const partido of partidos) {
  const propias = filas.filter((f) => f.partido === partido)
  const ids = new Set(propias.map((f) => f.distrito))
  if (propias.length !== 15 || ids.size !== 15) {
    throw new Error(`${partido}: se esperaban 15 distritos únicos, hay ${propias.length} (${ids.size} únicos)`)
  }
  for (let d = 1; d <= 15; d++) {
    if (!ids.has(d)) throw new Error(`${partido}: falta el distrito ${d}`)
  }
  const conteo = new Map()
  for (const f of propias) conteo.set(f.porcentaje, (conteo.get(f.porcentaje) ?? 0) + 1)
  for (const [pct, n] of conteo) {
    if (n > 1) console.warn(`  aviso ${partido}: ${n} distritos empatados en ${pct}% (se desempata por número de distrito)`)
  }
}

// El id del CSV de votación es el número que ese archivo trae, y NO coincide con
// el orden de registro: ahí PT es 3 y PVEM 4, mientras que en el registro es al
// revés. Se cruza por siglas, nunca por número, y se avisa de la discrepancia.
for (const partido of partidos) {
  if (!idPorSiglas.has(partido)) {
    throw new Error(`El CSV de votación trae "${partido}", que no está en el registro de partidos`)
  }
  const enCsv = filas.find((f) => f.partido === partido).idPartido
  const enRegistro = idPorSiglas.get(partido)
  if (enCsv !== enRegistro) {
    console.warn(`  aviso ${partido}: id ${enCsv} en el CSV de votación, ${enRegistro} en el registro. Se usa el del registro.`)
  }
}

const cabeceras = new Map()
for (const f of filas) {
  const previa = cabeceras.get(f.distrito)
  if (previa !== undefined && previa !== f.cabecera) {
    throw new Error(`Distrito ${f.distrito}: cabecera inconsistente ("${previa}" vs "${f.cabecera}")`)
  }
  cabeceras.set(f.distrito, f.cabecera)
}

const origenes = [...new Set(filas.map((f) => f.origen))]
if (origenes.length !== 1) {
  console.warn(`  aviso: el CSV mezcla orígenes de dato: ${origenes.join(', ')}`)
}

// --- Generación ---
const encabezado = `// ARCHIVO GENERADO — no editar a mano.
// Fuente: data/${path.basename(CSV)}
// Regenerar con: pnpm catalogo:generar
`

const lineasPartidos = registro
  .map((r) => `  { id_partido: ${r.id}, siglas: '${r.siglas}', nombre: ${JSON.stringify(r.nombre)} },`)
  .join(NL)

const lineasAtajos = registro.map((r) => `  ${r.siglas}: ${r.id},`).join(NL)

fs.writeFileSync(path.join(SALIDA, 'partidos.ts'), `${encabezado}// Registro: data/${path.basename(CSV_PARTIDOS)}

/**
 * Partidos con registro vigente, en el orden en que lo obtuvieron.
 *
 * El \`id_partido\` **es** ese orden de registro, y es la identidad del partido en
 * todo el sistema. Las siglas son una etiqueta para mostrar, no una llave: pueden
 * cambiar sin que cambie el partido.
 *
 * Ojo: el id NO coincide con el que trae el CSV de votación del PEL 2023-2024.
 * El cruce entre ambas fuentes se hace por siglas.
 */
export const PARTIDOS = [
${lineasPartidos}
] as const

/** Atajo legible: \`PARTIDO.MORENA\` en vez de un 6 suelto. */
export const PARTIDO = {
${lineasAtajos}
} as const

export type IdPartido = (typeof PARTIDOS)[number]['id_partido']
export type Partido = (typeof PARTIDOS)[number]

const POR_ID = new Map<number, Partido>(PARTIDOS.map((p) => [p.id_partido, p]))

export function partidoDe(id: IdPartido): Partido {
  const partido = POR_ID.get(id)
  if (!partido) throw new Error(\`Partido \${id} ausente del registro\`)
  return partido
}

/** Siglas para mostrar. Todo rótulo pasa por aquí; el id nunca se imprime. */
export function siglasDe(id: IdPartido): string {
  return partidoDe(id).siglas
}

export function nombreDe(id: IdPartido): string {
  return partidoDe(id).nombre
}

/** Emblema oficial. El archivo se llama como las siglas. */
export function emblemaDe(id: IdPartido): string {
  return \`${EMBLEMAS}/\${siglasDe(id)}.svg\`
}
`)

const lineasDistritos = Array.from({ length: 15 }, (_, i) => {
  const id = i + 1
  return `  { id_distrito: ${id}, numero_romano: '${ROMANOS[i]}', cabecera: ${JSON.stringify(cabeceras.get(id))}, mayoria_indigena: ${id === DISTRITO_INDIGENA} },`
}).join(NL)

fs.writeFileSync(path.join(SALIDA, 'distritos.ts'), `${encabezado}
import type { Distrito } from '../types'

/** Catálogo geográfico: propiedad del distrito, igual para todos los partidos. */
export const DISTRITOS: readonly Distrito[] = [
${lineasDistritos}
]
`)

const lineasVotacion = filas
  .sort((a, b) => idPorSiglas.get(a.partido) - idPorSiglas.get(b.partido) || a.distrito - b.distrito)
  .map((f) => `  { partido: ${idPorSiglas.get(f.partido)}, id_distrito: ${f.distrito}, porcentaje: ${f.porcentaje}, votos: ${f.votos} },`)
  .join(NL)

fs.writeFileSync(path.join(SALIDA, 'votacion.ts'), `${encabezado}
import type { RegistroVotacion } from '../types'

/**
 * Porcentaje de votación individual obtenido en el PEL 2023-2024, aprobado por el
 * Consejo General. Es la base de todo cálculo de competitividad: para un partido que
 * compite individualmente se usa tal cual; para una coalición o candidatura común se
 * suman los porcentajes individuales de los partidos que la integran.
 *
 * Solo aparecen los partidos que compitieron. Los de registro nuevo no tienen
 * historial, y su porcentaje se toma como cero en todos los distritos.
 */
export const VOTACION: readonly RegistroVotacion[] = [
${lineasVotacion}
]
`)

const nuevos = registro.filter((r) => !partidos.includes(r.siglas)).map((r) => r.siglas)
console.log(`Generado: ${registro.length} partidos en el registro, ${partidos.length} con historial x 15 distritos = ${filas.length} registros`)
if (nuevos.length) console.log(`  sin votación en 2023-2024: ${nuevos.join(', ')}`)
