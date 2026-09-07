import { Font } from '@react-pdf/renderer'
import { emblemaDe } from '@/domain/catalogo'
import type { IdPartido } from '../domain/types'

/**
 * Los archivos que el documento necesita y no puede traer de la red.
 *
 * Viven en `public/impresion/`, no en `src/`, a propósito: importarlos como
 * módulos haría que el proyecto no compilara mientras falte uno, y aquí se
 * quiere lo contrario —que la aplicación arranque igual y sea el documento el
 * que se degrade—. Al servirse del mismo origen tampoco hay CORS que falle en el
 * peor momento.
 *
 * | Archivo                          | Si falta                             |
 * |----------------------------------|--------------------------------------|
 * | `impresion/logo.png`             | El membrete se escribe en texto      |
 * | `impresion/Roboto-Regular.ttf`   | El documento se compone en Helvetica |
 * | `impresion/Roboto-Medium.ttf`    | Los títulos van en Helvetica-Bold    |
 *
 * Los emblemas de los partidos no están en esta tabla: no son de impresión, los
 * usa todo el sitio y su ruta la sabe el catálogo. Aquí solo se convierten a
 * `data:` URI, y solo los de quien postula —no tiene sentido bajar once para el
 * documento de un partido—.
 */
const BASE = `${import.meta.env.BASE_URL}impresion`

const RUTA = {
  logotipo: `${BASE}/logo.png`,
  regular: `${BASE}/Roboto-Regular.ttf`,
  medium: `${BASE}/Roboto-Medium.ttf`,
} as const

export interface Recursos {
  /** El logotipo como `data:` URI, o `null` si no se pudo traer. */
  logotipo: string | null
  /** La familia con la que componer: la del simulador, o la de reserva. */
  familia: 'Roboto' | 'Helvetica'
  /** Emblemas por partido. Ausente el que no se pudo traer. */
  emblemas: Partial<Record<IdPartido, string>>
}

async function traer(ruta: string): Promise<ArrayBuffer | null> {
  try {
    const respuesta = await fetch(ruta)
    if (!respuesta.ok) return null
    return await respuesta.arrayBuffer()
  } catch {
    return null
  }
}

function comoDataURI(bytes: ArrayBuffer, tipo: string): string {
  let binario = ''
  const octetos = new Uint8Array(bytes)
  // De mil en mil: `String.fromCharCode` recibe los octetos como argumentos y
  // un logotipo entero de una sola llamada desborda la pila.
  for (let i = 0; i < octetos.length; i += 1024) {
    binario += String.fromCharCode(...octetos.subarray(i, i + 1024))
  }
  return `data:${tipo};base64,${btoa(binario)}`
}

let membrete: Promise<Omit<Recursos, 'emblemas'>> | null = null
const emblemas = new Map<IdPartido, Promise<string | null>>()

function cargarEmblema(partido: IdPartido): Promise<string | null> {
  let pendiente = emblemas.get(partido)
  if (!pendiente) {
    pendiente = traer(emblemaDe(partido)).then((bytes) =>
      bytes ? comoDataURI(bytes, 'image/png') : null,
    )
    emblemas.set(partido, pendiente)
  }
  return pendiente
}

/**
 * Trae el logotipo, registra las tipografías y baja los emblemas de quien
 * postula. Todo queda en caché: generar dos veces el documento no vuelve a pedir
 * ningún archivo.
 */
export async function cargarRecursos(partidos: readonly IdPartido[]): Promise<Recursos> {
  const [base, ...traidos] = await Promise.all([
    cargarMembrete(),
    ...partidos.map((partido) => cargarEmblema(partido)),
  ])
  const porPartido: Partial<Record<IdPartido, string>> = {}
  partidos.forEach((partido, i) => {
    const emblema = traidos[i]
    if (emblema) porPartido[partido] = emblema
  })
  return { ...base, emblemas: porPartido }
}

function cargarMembrete(): Promise<Omit<Recursos, 'emblemas'>> {
  membrete ??= (async () => {
    const [logotipo, regular, medium] = await Promise.all([
      traer(RUTA.logotipo),
      traer(RUTA.regular),
      traer(RUTA.medium),
    ])

    // Las dos o ninguna: componer el cuerpo en Roboto y los títulos en Helvetica
    // se vería como un error de imprenta, no como una degradación.
    //
    // Van como `data:` URI y no como los octetos que ya tenemos en la mano:
    // `src` es una cadena, y lo que no reconoce como URL o como nombre de
    // tipografía estándar lo trata como **ruta de archivo**. Un `ArrayBuffer`
    // caía ahí y hacía fallar la composición entera dentro del navegador.
    let familia: Recursos['familia'] = 'Helvetica'
    if (regular && medium) {
      Font.register({
        family: 'Roboto',
        fonts: [
          { src: comoDataURI(regular, 'font/ttf'), fontWeight: 400 },
          { src: comoDataURI(medium, 'font/ttf'), fontWeight: 500 },
        ],
      })
      familia = 'Roboto'
    }

    return { logotipo: logotipo ? comoDataURI(logotipo, 'image/png') : null, familia }
  })()
  return membrete
}
