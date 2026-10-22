import { describe, expect, it } from 'vitest'
import { PARTIDO, siglasDe } from '../catalogo'
import type { IdPartido } from '../types'
import { aplicanBloques, puedeCoaligarse, sinDerechoACoalicion } from './elegibilidad'

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

  it('los locales sí pueden coaligarse', () => {
    // El 9.5 alcanza solo a los nacionales de nuevo registro. Confundirlo con
    // «todo el que no tiene historial» dejaría fuera a tres partidos que la
    // norma no excluye.
    for (const partido of [PARTIDO.PESD, PARTIDO.PV, PARTIDO.PER]) {
      expect(puedeCoaligarse(partido), siglasDe(partido)).toBe(true)
      expect(aplicanBloques(partido), siglasDe(partido)).toBe(false)
    }
  })

  it('nombra a los integrantes vetados en orden de registro', () => {
    expect(sinDerechoACoalicion([PARTIDO.SOMOS, PARTIDO.PAN, PARTIDO.PAZ]).map(siglasDe)).toEqual([
      'SOMOS',
      'PAZ',
    ])
    expect(sinDerechoACoalicion([PARTIDO.PAN, PARTIDO.PRI])).toEqual([])
  })
})
