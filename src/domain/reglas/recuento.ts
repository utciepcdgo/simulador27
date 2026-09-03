import { siglasDe } from '../catalogo/partidos'
import { accionAfirmativaEfectiva, esMujer } from '../genero'
import type {
  AccionAfirmativa,
  EstadoSimulacion,
  Genero,
  GeneroParidad,
  PerfilCandidato,
  TokenFormula,
} from '../types'
import { ambitosDe, conteoGenero, minimoMujeres } from './base'
import { CRITERIOS_LEY, type Criterios } from './criterios'

/**
 * Los grupos que el recuento sigue.
 *
 * La juventud va junto a las acciones afirmativas porque se comporta igual: es
 * una condición de la persona que solo acredita cuota cuando la comparten los
 * dos integrantes de la fórmula.
 */
export type Grupo = 'Joven' | Exclude<AccionAfirmativa, 'Ninguna'>

export const GRUPOS: readonly Grupo[] = [
  'Joven',
  'Indígena',
  'Discapacidad',
  'Diversidad Sexual',
  'Adulto Mayor',
  'Migrante',
]

function pertenece(perfil: PerfilCandidato, grupo: Grupo): boolean {
  if (grupo === 'Joven') return perfil.esJoven
  return accionAfirmativaEfectiva(perfil) === grupo
}

export interface RecuentoGrupo {
  grupo: Grupo
  /** Fórmulas que **acreditan** la cuota: sus dos integrantes son del grupo. */
  formulas: number
  /** Personas del grupo, acredite su fórmula o no. */
  candidaturas: number
  /**
   * Personas del grupo que ninguna fórmula acreditada respalda.
   *
   * Es la cifra que el semáforo de cumplimiento no puede mostrar. Una fórmula de
   * hombre joven con suplencia de hombre indígena es postulable y legal, pero no
   * acredita ninguna de las dos cuotas: sin esta columna, esas dos personas
   * desaparecerían del tablero como si no existieran.
   */
  sinAcreditar: number
}

export interface Recuento {
  formulas: number
  candidaturas: number
  /** Por quien encabeza la fórmula. Los perfiles no binarios cuentan como hombres. */
  encabezan: Record<GeneroParidad, number>
  /** Una entrada por persona, con su género declarado. */
  personas: Record<Genero, number>
  grupos: RecuentoGrupo[]
}

export function recontar(formulas: readonly TokenFormula[]): Recuento {
  const encabezan: Record<GeneroParidad, number> = { Mujer: 0, Hombre: 0 }
  const personas: Record<Genero, number> = { Mujer: 0, Hombre: 0, 'No Binario': 0 }

  for (const formula of formulas) {
    encabezan[esMujer(formula.propietario) ? 'Mujer' : 'Hombre'] += 1
    personas[formula.propietario.genero] += 1
    personas[formula.suplente.genero] += 1
  }

  const grupos = GRUPOS.map((grupo) => {
    let acreditadas = 0
    let candidaturas = 0
    for (const { propietario, suplente } of formulas) {
      const enPropietario = pertenece(propietario, grupo)
      const enSuplente = pertenece(suplente, grupo)
      if (enPropietario) candidaturas += 1
      if (enSuplente) candidaturas += 1
      if (enPropietario && enSuplente) acreditadas += 1
    }
    return {
      grupo,
      formulas: acreditadas,
      candidaturas,
      sinAcreditar: candidaturas - acreditadas * 2,
    }
  })

  return {
    formulas: formulas.length,
    candidaturas: formulas.length * 2,
    encabezan,
    personas,
    grupos,
  }
}

/** Cómo va la paridad de un ámbito que responde por su propio 50%. */
export interface ParidadDeAmbito {
  /** Llave estable de render: la etiqueta del ámbito. */
  ambito: string
  /** Rótulo corto: las siglas del partido, o el nombre de la alianza. */
  siglas: string
  mujeres: number
  hombres: number
  sinAsignar: number
  total: number
  /** `null` cuando el ámbito no responde por su propia paridad. */
  minimo: number | null
}

export interface RecuentoPostulacion {
  mayoria: Recuento
  proporcional: Recuento
  /**
   * Un renglón por ámbito que cuenta para la paridad: el convenio de la alianza
   * y el registro consolidado de cada integrante. El mínimo va en `null` donde
   * la norma no impone uno —el integrante de una coalición total—, para que la
   * tira no dibuje un umbral que no existe.
   */
  paridad: ParidadDeAmbito[]
}

function formulasEnMR(estado: EstadoSimulacion): TokenFormula[] {
  return estado.distritos.flatMap((distrito) => {
    const { postulacion } = distrito
    if (postulacion.modo === 'convenio') return postulacion.formula ? [postulacion.formula] : []
    if (postulacion.modo === 'fuera') {
      return Object.values(postulacion.formulas).filter((f): f is TokenFormula => Boolean(f))
    }
    return []
  })
}

/**
 * Composición de la postulación, no su cumplimiento.
 *
 * Mayoría relativa y Lista "A" se cuentan por separado porque son universos que
 * no se suman: una fórmula de RP no aparece en ningún distrito.
 */
export function recuentoDe(
  estado: EstadoSimulacion,
  criterios: Criterios = CRITERIOS_LEY,
): RecuentoPostulacion {
  const paridad = ambitosDe(estado)
    .filter(
      (ambito) =>
        ambito.tipo === 'consolidado' || (ambito.tipo === 'tablero' && ambito.paridadPropia),
    )
    .map((ambito) => {
      const { mujeres, hombres, asignadas, sinAsignar, total } = conteoGenero(ambito.distritos)
      // El mismo universo que usa el dictamen: la tira no puede marcar un umbral
      // distinto del que la regla exige.
      const universo = criterios.denominadorParidad === 'registradas' ? asignadas : total
      return {
        ambito: ambito.etiqueta,
        siglas: ambito.partido !== null ? siglasDe(ambito.partido) : 'Convenio',
        mujeres,
        hombres,
        sinAsignar,
        total,
        minimo: ambito.paridadPropia ? minimoMujeres(universo) : null,
      }
    })

  return {
    mayoria: recontar(formulasEnMR(estado)),
    proporcional: recontar(
      estado.listasRP.flatMap((lista) =>
        lista.posiciones.filter((f): f is TokenFormula => f !== null),
      ),
    ),
    paridad,
  }
}
