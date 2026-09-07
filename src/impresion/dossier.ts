import { nombreDe, siglasDe } from '../domain/catalogo'
import {
  ambitosDe,
  declinaPostular,
  esCerrable,
  evaluarSimulacion,
  recuentoDe,
  repartirConvenio,
  type Criterios,
  type RecuentoPostulacion,
  type ReparticionConvenio,
} from '@/domain/reglas'
import type {
  Bloque,
  DistritoEvaluado,
  EstadoSimulacion,
  IdPartido,
  TokenFormula,
} from '@/domain/types'

const BLOQUES: readonly Bloque[] = ['Alta', 'Media', 'Baja']

/** Un distrito que el ámbito dejó fuera de su postulación (artículo 27). */
export interface DistritoRetirado {
  numero_romano: string
  cabecera: string
}

export interface TableroImpreso {
  etiqueta: string
  partido: string
  /** Los partidos cuyo porcentaje sustenta este ranking. */
  partidos: readonly IdPartido[]
  fuera: boolean
  /** Si el siglado dice algo aquí: solo en el convenio de una alianza. */
  conSiglado: boolean
  bloques: { bloque: Bloque; distritos: readonly DistritoEvaluado[] }[]
  retirados: DistritoRetirado[]
}

export interface ListaImpresa {
  partido: IdPartido
  siglas: string
  nombre: string
  posiciones: readonly (TokenFormula | null)[]
}

/**
 * Una regla y lo que arrojó en cada ámbito donde se aplicó.
 *
 * Agrupa por regla y no por ámbito para que el fundamento se imprima una vez.
 * La paridad general se evalúa en el convenio y en el registro de cada
 * integrante, y su artículo mide seiscientos ochenta caracteres: repetirlo
 * cuatro veces no documenta nada que la primera no dijera ya. Sigue siendo el
 * desglose completo —toda regla, en todo ámbito—, ordenado por lo que se
 * verifica en vez de por dónde.
 */
export interface GrupoDictamen {
  regla: string
  fundamento: string
  /** `partidos` viene del motor: es de quién habla el hallazgo, sin deducirlo del texto. */
  hallazgos: { alcance: string; mensaje: string; partidos: readonly IdPartido[] }[]
}

/**
 * Todo lo que el documento imprime, ya derivado y en el orden en que se lee.
 *
 * Se arma aquí y no dentro de los componentes de `react-pdf` para que la
 * composición no tenga que consultar al motor mientras maqueta: el papel decide
 * cómo se ve, nunca qué dice.
 */
export interface Dossier {
  generado: Date
  postulante: {
    modalidad: string
    integrantes: { id: IdPartido; siglas: string; nombre: string }[]
    solo: boolean
  }
  /** `null` cuando el partido compite solo: no hay convenio que resumir. */
  convenio: (ReparticionConvenio & { porPartido: { siglas: string; distritos: number }[] }) | null
  tableros: TableroImpreso[]
  listas: ListaImpresa[]
  recuento: RecuentoPostulacion
  dictamen: GrupoDictamen[]
  /** Cuántas reglas se verificaron. Va al encabezado del dictamen. */
  reglasVerificadas: number
  /**
   * Sobre cuántos ámbitos distintos se evaluaron.
   *
   * Se cuentan los alcances que el dictamen enlista de verdad, y no los
   * tableros: hay ámbitos que no son un tablero —el registro consolidado de cada
   * partido, la Lista «A» de cada uno, la integración del convenio— y contar
   * solo los tableros daba una cifra que el propio documento desmentía renglón
   * por renglón.
   */
  ambitosEvaluados: number
}

/**
 * ¿Puede cerrarse esta simulación? Es la única condición para generar el
 * documento: mientras quede una regla incumplida —falte llenar un distrito o
 * sobre una sustitución— no hay nada que certificar.
 */
export function puedeImprimirse(estado: EstadoSimulacion, criterios: Criterios): boolean {
  return esCerrable(evaluarSimulacion(estado, criterios))
}

export function armarDossier(estado: EstadoSimulacion, criterios: Criterios): Dossier {
  const { postulante, distritos, listasRP } = estado
  const solo = postulante.integrantes.length === 1
  const resultados = evaluarSimulacion(estado, criterios)

  const tableros = ambitosDe(estado)
    .filter((a) => a.tipo === 'tablero')
    .map<TableroImpreso>((ambito) => {
      const suyo = ambito.fuera ? ambito.partido : null
      // El mismo criterio que en pantalla: en un tablero individual la negativa
      // es del partido; en el de quien compite solo, del distrito entero.
      const retirados = suyo
        ? distritos.filter((d) => declinaPostular(d.postulacion, suyo))
        : solo
          ? distritos.filter((d) => d.postulacion.modo === 'sin-postular')
          : []
      return {
        etiqueta: ambito.etiqueta,
        partido: ambito.partido === null ? 'Partido' : nombreDe(ambito.partido),
        partidos: ambito.partido !== null ? [ambito.partido] : postulante.integrantes,
        fuera: ambito.fuera,
        conSiglado: ambito.partido === null,
        bloques: BLOQUES.map((bloque) => ({
          bloque,
          distritos: ambito.distritos
            .filter((d) => d.bloque === bloque)
            .sort((a, b) => a.posicion_rentabilidad - b.posicion_rentabilidad),
        })),
        retirados: retirados.map((d) => ({
          numero_romano: d.numero_romano,
          cabecera: d.cabecera,
        })),
      }
    })

  // El orden es el de primera aparición en el motor, que ya va de lo general a
  // lo particular: integración del convenio, paridad, bloques, medidas.
  const dictamen: GrupoDictamen[] = []
  const porRegla = new Map<string, GrupoDictamen>()
  for (const resultado of resultados) {
    let grupo = porRegla.get(resultado.regla)
    if (!grupo) {
      grupo = { regla: resultado.regla, fundamento: resultado.fundamento_legal, hallazgos: [] }
      porRegla.set(resultado.regla, grupo)
      dictamen.push(grupo)
    }
    grupo.hallazgos.push({
      alcance: resultado.alcance,
      mensaje: resultado.mensaje,
      partidos: resultado.partidos ?? [],
    })
  }

  return {
    generado: new Date(),
    postulante: {
      modalidad: postulante.modalidad,
      integrantes: postulante.integrantes.map((id) => ({
        id,
        siglas: siglasDe(id),
        nombre: nombreDe(id),
      })),
      solo,
    },
    convenio: solo
      ? null
      : {
          ...repartirConvenio(estado),
          porPartido: postulante.integrantes.map((partido) => ({
            siglas: siglasDe(partido),
            distritos: distritos.filter(
              (d) => d.postulacion.modo === 'convenio' && d.postulacion.partido === partido,
            ).length,
          })),
        },
    tableros,
    listas: listasRP.map((lista) => ({
      partido: lista.partido,
      siglas: siglasDe(lista.partido),
      nombre: nombreDe(lista.partido),
      posiciones: lista.posiciones,
    })),
    recuento: recuentoDe(estado, criterios),
    dictamen,
    reglasVerificadas: resultados.length,
    ambitosEvaluados: new Set(resultados.map((r) => r.alcance)).size,
  }
}
