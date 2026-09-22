import { describe, expect, it } from 'vitest'
import { coalicion, individual, PARTIDO, tableroInicial } from '../catalogo'
import type { DistritoActivo, EstadoSimulacion, IdPartido, Postulante } from '../types'
import { CRITERIOS_LEY } from './criterios'
import { documentoDeReglas } from './documento'
import { evaluarSimulacion } from './index'
import { INVENTARIO_REGLAS } from './inventario'

/** Un estado con el convenio repartido según la posición de rentabilidad. */
function escenario(
  postulante: Postulante,
  destino: (posicion: number) => IdPartido | 'fuera',
): EstadoSimulacion {
  const distritos: DistritoActivo[] = tableroInicial(postulante).map((d) => {
    const elegido = destino(d.posicion_rentabilidad)
    return {
      ...d,
      postulacion:
        elegido === 'fuera'
          ? { modo: 'fuera', formulas: {} }
          : { modo: 'convenio', partido: elegido, formula: null },
    }
  })
  return {
    postulante,
    distritos,
    listasRP: postulante.integrantes.map((partido) => ({
      partido,
      posiciones: [null, null, null, null, null],
    })),
  }
}

/**
 * Los escenarios que, entre todos, hacen aparecer cada regla al menos una vez.
 *
 * Un partido solo, una coalición total y una parcial: la tercera es la que
 * produce los tableros individuales y las exenciones que las otras dos callan.
 */
const ESCENARIOS = [
  escenario(individual(PARTIDO.PAN), () => PARTIDO.PAN),
  escenario(coalicion(PARTIDO.PAN, PARTIDO.PRI), (p) => (p <= 8 ? PARTIDO.PAN : PARTIDO.PRI)),
  escenario(coalicion(PARTIDO.PAN, PARTIDO.PRI), (p) =>
    p > 12 ? 'fuera' : p <= 6 ? PARTIDO.PAN : PARTIDO.PRI,
  ),
]

function emitidas(): Set<string> {
  const nombres = new Set<string>()
  for (const estado of ESCENARIOS) {
    for (const resultado of evaluarSimulacion(estado, CRITERIOS_LEY)) nombres.add(resultado.regla)
  }
  return nombres
}

/** ¿Esta entrada del inventario cubre ese nombre? La de bloques se multiplica. */
function cubre(nombre: string): boolean {
  return INVENTARIO_REGLAS.some(
    (r) => r.regla === nombre || (r.porBloque === true && nombre.startsWith(`${r.regla} `)),
  )
}

describe('inventario de reglas', () => {
  it('cubre toda regla que el motor sabe emitir', () => {
    // Es la prueba que impide que el documento envejezca: añadir una regla sin
    // inventariarla rompe aquí, no meses después al leer una especificación que
    // ya no describe al motor.
    const huerfanas = [...emitidas()].filter((nombre) => !cubre(nombre))
    expect(huerfanas).toEqual([])
  })

  it('no inventaría reglas que el motor no emite', () => {
    // La deriva en el otro sentido: una regla que se retiró del motor y quedó
    // documentada seguiría prometiendo una verificación que ya no ocurre.
    const nombres = emitidas()
    const fantasmas = INVENTARIO_REGLAS.filter(
      (r) =>
        !(r.ambito === 'Token' || r.regla === 'Integración del tablero') &&
        ![...nombres].some((n) => n === r.regla || (r.porBloque === true && n.startsWith(`${r.regla} `))),
    ).map((r) => r.regla)
    expect(fantasmas).toEqual([])
  })

  it('cita un fundamento en cada entrada', () => {
    for (const regla of INVENTARIO_REGLAS) {
      expect(regla.fundamento, regla.regla).toMatch(/Artículos?\s/)
    }
  })

  it('el documento publicado coincide con el motor', async () => {
    // Instantánea de archivo: `pnpm reglas:generar` la reescribe, y cualquier
    // otra corrida falla si `docs/reglas.md` se quedó atrás.
    await expect(documentoDeReglas()).toMatchFileSnapshot('../../../docs/reglas.md')
  })
})
