import { describe, expect, it } from 'vitest'
import { PARTIDO, siglasDe } from '../catalogo'
import type { IdPartido } from '../types'
import {
  aplicanBloques,
  impedimentoDeConvenio,
  puedeCoaligarse,
  puedeParticiparEn,
  puedeSuscribirCandidaturaComun,
} from './elegibilidad'
import { FUNDAMENTOS } from './fundamentos'

const TODOS = Object.values(PARTIDO) as IdPartido[]

/**
 * Fija el padrón vigente contra el CSV aprobado.
 *
 * Son listas escritas a mano a propósito: si alguien cambia una celda del
 * registro, estas pruebas tienen que fallar y obligar a confirmar el cambio
 * contra el acuerdo, no absorberlo en silencio. Las dos listas salen de la tabla
 * del punto 1 de `docs/pendientes-juridicos.md`.
 */
describe('elegibilidad por ámbito y registro', () => {
  it('cierra la coalición a los nacionales de nuevo registro (artículo 9.5)', () => {
    expect(TODOS.filter((p) => !puedeCoaligarse(p)).map(siglasDe)).toEqual(['PAZ', 'SOMOS'])
  })

  it('exime de los bloques a los locales y a los de nuevo registro (artículos 23.2 y 29.2)', () => {
    expect(TODOS.filter((p) => !aplicanBloques(p)).map(siglasDe)).toEqual([
      'PESD',
      'PV',
      'PER',
      'PAZ',
      'SOMOS',
    ])
  })

  it('cierra también la candidatura común a los mismos (artículo 11.3)', () => {
    // El 9.5 y el 11.3 son dos prohibiciones distintas con el mismo supuesto.
    // Durante un tiempo el simulador aplicó solo la primera, por dar por hecho
    // que la segunda no existía: a PAZ y SOMOS les quedaba abierta una figura
    // de postulación conjunta que la norma también les cierra.
    expect(TODOS.filter((p) => !puedeSuscribirCandidaturaComun(p)).map(siglasDe)).toEqual([
      'PAZ',
      'SOMOS',
    ])
  })

  it('a un nacional de nuevo registro solo le queda la postulación individual', () => {
    for (const modalidad of ['Coalición', 'Candidatura Común'] as const) {
      const impedimento = impedimentoDeConvenio([PARTIDO.PAN, PARTIDO.PAZ], modalidad)
      expect(impedimento?.vetados.map(siglasDe), modalidad).toEqual(['PAZ'])
    }
    expect(impedimentoDeConvenio([PARTIDO.PAZ], 'Individual')).toBeNull()
  })

  it('cita el artículo de la figura que se intentó, no el de la otra', () => {
    // Citar el 9.5 ante una candidatura común sería un error de fondo: manda a
    // leer un artículo que no habla de lo que se acaba de intentar.
    expect(impedimentoDeConvenio([PARTIDO.PAZ], 'Coalición')?.fundamento).toBe(
      FUNDAMENTOS.coalicionNuevoRegistro,
    )
    expect(impedimentoDeConvenio([PARTIDO.PAZ], 'Candidatura Común')?.fundamento).toBe(
      FUNDAMENTOS.candidaturaComunNuevoRegistro,
    )
  })

  it('no impide nada a quien sí puede', () => {
    for (const modalidad of ['Coalición', 'Candidatura Común'] as const) {
      expect(impedimentoDeConvenio([PARTIDO.PAN, PARTIDO.PRI], modalidad), modalidad).toBeNull()
    }
  })

  it('la postulación individual no excluye a nadie', () => {
    // Es la figura que le queda a quien no puede suscribir convenio: si aquí
    // también se le cerrara, no podría competir.
    for (const partido of TODOS) {
      expect(puedeParticiparEn(partido, 'Individual'), siglasDe(partido)).toBe(true)
    }
  })

  it('el predicado por partido concuerda con el impedimento del conjunto', () => {
    // La interfaz apaga casillas con el primero y explica el motivo con el
    // segundo. Si discreparan, habría un partido apagado sin explicación o
    // explicado sin apagar.
    for (const modalidad of ['Coalición', 'Candidatura Común', 'Individual'] as const) {
      const porPartido = TODOS.filter((p) => !puedeParticiparEn(p, modalidad))
      const delConjunto = impedimentoDeConvenio(TODOS, modalidad)?.vetados ?? []
      expect(porPartido, modalidad).toEqual(delConjunto)
    }
  })

  it('los locales sí pueden las dos figuras', () => {
    // El 9.5 alcanza solo a los nacionales de nuevo registro. Confundirlo con
    // «todo el que no tiene historial» dejaría fuera a tres partidos que la
    // norma no excluye.
    for (const partido of [PARTIDO.PESD, PARTIDO.PV, PARTIDO.PER]) {
      expect(puedeCoaligarse(partido), siglasDe(partido)).toBe(true)
      expect(puedeSuscribirCandidaturaComun(partido), siglasDe(partido)).toBe(true)
      expect(aplicanBloques(partido), siglasDe(partido)).toBe(false)
    }
  })

  it('nombra a los integrantes vetados en orden de registro', () => {
    const impedimento = impedimentoDeConvenio(
      [PARTIDO.SOMOS, PARTIDO.PAN, PARTIDO.PAZ],
      'Coalición',
    )
    expect(impedimento?.vetados.map(siglasDe)).toEqual(['SOMOS', 'PAZ'])
  })
})
