import { describe, expect, it } from 'vitest'
import { DISTRITOS } from './distritos'
import { PARTIDO, PARTIDOS } from './partidos'
import type { IdPartido } from '../types'
import { VOTACION } from './votacion'
import {
  bloqueDePosicion,
  integrarBloques,
  porcentajesDe,
  posicionesBlindadas,
  posicionesCabezaDeBloque,
  tamanosDeBloque,
  tieneHistorial,
  coalicion,
  competitividad,
  individual,
  tableroInicial,
} from './rentabilidad'

describe('integridad del catálogo', () => {
  it('tiene 15 distritos con romanos y cabeceras', () => {
    expect(DISTRITOS).toHaveLength(15)
    expect(DISTRITOS.map((d) => d.id_distrito)).toEqual(
      Array.from({ length: 15 }, (_, i) => i + 1),
    )
    expect(DISTRITOS.at(-1)).toMatchObject({ numero_romano: 'XV', cabecera: 'Pueblo Nuevo' })
  })

  it('exige fórmula indígena en un solo distrito, el XV', () => {
    const conCuota = DISTRITOS.filter((d) => d.mayoria_indigena)
    expect(conCuota).toHaveLength(1)
    expect(conCuota[0].numero_romano).toBe('XV')
  })

  it('registra 11 partidos, 6 de ellos con votación de 2023-2024', () => {
    expect(PARTIDOS).toHaveLength(11)
    expect(VOTACION).toHaveLength(90)
    expect(new Set(VOTACION.map((v) => v.partido)).size).toBe(6)
  })

  it('numera a los partidos por su orden de registro', () => {
    expect(PARTIDOS.map((p) => p.id_partido)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
    // El CSV de votación numera al PVEM como 4 y al PT como 3; el registro los
    // invierte, y es el registro el que manda.
    expect(PARTIDO.PVEM).toBe(3)
    expect(PARTIDO.PT).toBe(4)
  })

  it('deja en nulo a los partidos sin historial, no en cero', () => {
    // Cero afirmaría que esa fue su votación válida emitida, y lo que ocurrió
    // es que no hubo elección en la que participar.
    expect(tieneHistorial(PARTIDO.MORENA)).toBe(true)
    expect(tieneHistorial(PARTIDO.SOMOS)).toBe(false)
    const nuevo = porcentajesDe([PARTIDO.SOMOS])
    expect(nuevo).toHaveLength(15)
    expect(nuevo.every((p) => p.porcentaje === null)).toBe(true)
    // Y su tablero sigue teniendo los quince distritos, no queda vacío.
    expect(competitividad(individual(PARTIDO.SOMOS))).toHaveLength(15)
  })

  it('la suma de una alianza ignora el nulo, como SUM', () => {
    // PESD no compitió; PAN sí. El convenio vale lo que aporta quien compitió,
    // ni más ni menos: el nulo no suma ni resta.
    const [soloPan] = porcentajesDe([PARTIDO.PAN], [1])
    const [conLocal] = porcentajesDe([PARTIDO.PAN, PARTIDO.PESD], [1])
    expect(soloPan.porcentaje).not.toBeNull()
    expect(conLocal.porcentaje).toBe(soloPan.porcentaje)
    // Y si ninguno compitió, sigue siendo nulo.
    const [ninguno] = porcentajesDe([PARTIDO.PESD, PARTIDO.PV], [1])
    expect(ninguno.porcentaje).toBeNull()
  })
})

describe('integración parcial de bloques', () => {
  const SIETE = [1, 2, 3, 4, 5, 6, 7]

  it('reparte los tres bloques y da el excedente a los primeros', () => {
    expect(tamanosDeBloque(15)).toEqual({ Alta: 5, Media: 5, Baja: 5 })
    expect(tamanosDeBloque(8)).toEqual({ Alta: 3, Media: 3, Baja: 2 })
    expect(tamanosDeBloque(7)).toEqual({ Alta: 3, Media: 2, Baja: 2 })
    expect(tamanosDeBloque(4)).toEqual({ Alta: 2, Media: 1, Baja: 1 })
    expect(tamanosDeBloque(0)).toEqual({ Alta: 0, Media: 0, Baja: 0 })
  })

  it('renumera el subconjunto de 1 a N en vez de heredar el ranking de quince', () => {
    const siete = integrarBloques(porcentajesDe([PARTIDO.PAN], SIETE))
    expect(siete.map((c) => c.posicion_rentabilidad)).toEqual([1, 2, 3, 4, 5, 6, 7])
    const cuenta = (bloque: string) => siete.filter((c) => c.bloque === bloque).length
    expect([cuenta('Alta'), cuenta('Media'), cuenta('Baja')]).toEqual([3, 2, 2])
  })

  it('ordena de mayor a menor porcentaje', () => {
    const porcentajes = integrarBloques(porcentajesDe([PARTIDO.PAN], SIETE)).map((c) => c.porcentaje)
    expect(porcentajes.every((p) => p !== null)).toBe(true)
    expect([...porcentajes].sort((a, b) => b! - a!)).toEqual(porcentajes)
  })

  it('suma los porcentajes de la alianza también en un subconjunto', () => {
    const [solo] = integrarBloques(porcentajesDe([PARTIDO.PAN], [1]))
    const [aliados] = integrarBloques(porcentajesDe([PARTIDO.PAN, PARTIDO.PRI], [1]))
    expect(aliados.porcentaje!).toBeGreaterThan(solo.porcentaje!)
  })

  it('blinda las dos últimas del bloque Bajo, no las 14 y 15 absolutas', () => {
    expect(posicionesBlindadas(15)).toEqual([14, 15])
    expect(posicionesBlindadas(8)).toEqual([7, 8])
    expect(posicionesBlindadas(7)).toEqual([6, 7])
  })

  it('en el reparto 2-2-2 prohíbe un solo distrito, como manda el artículo 28.7', () => {
    // «Cuando los bloques se integren por dos distritos en cada bloque, en el
    // último de éstos bloques no se deberá postular mujeres en el último
    // distrito de menor porcentaje de votación.» Uno, no dos.
    expect(tamanosDeBloque(6)).toEqual({ Alta: 2, Media: 2, Baja: 2 })
    expect(posicionesBlindadas(6)).toEqual([6])
  })

  it('deja el ámbito de seis con solución: el techo alcanza el piso', () => {
    // Cerrando las dos posiciones del bloque bajo, el techo eran 2 fórmulas
    // encabezadas por mujeres y el piso del cincuenta por ciento pide 3, así que
    // ningún acomodo cumplía. Con una sola posición cerrada, el techo es 3.
    const tamanos = tamanosDeBloque(6)
    const prohibidas = posicionesBlindadas(6)
    const techo = (['Alta', 'Media', 'Baja'] as const).reduce((suma, bloque, i, todos) => {
      const inicio = todos.slice(0, i).reduce((n, b) => n + tamanos[b], 0) + 1
      const posiciones = Array.from({ length: tamanos[bloque] }, (_, j) => inicio + j)
      const admisibles = posiciones.filter((p) => !prohibidas.includes(p)).length
      return suma + Math.min(Math.ceil(tamanos[bloque] / 2), admisibles)
    }, 0)
    expect(techo).toBe(3)
  })

  it('no blinda fuera del bloque Bajo aunque el ámbito sea diminuto', () => {
    // 4 distritos reparten 2-1-1: el bloque Bajo es solo la posición 4.
    expect(posicionesBlindadas(4)).toEqual([4])
    expect(posicionesBlindadas(3)).toEqual([3])
    // 2 distritos reparten 1-1-0: sin bloque Bajo el blindaje es inoperante, y
    // blindar «las dos últimas» habría vedado a las mujeres el bloque Alto.
    expect(posicionesBlindadas(2)).toEqual([])
    expect(posicionesBlindadas(1)).toEqual([])
    expect(posicionesBlindadas(0)).toEqual([])
  })

  it('mantiene toda posición blindada dentro del bloque Bajo', () => {
    for (let total = 1; total <= 15; total += 1) {
      for (const posicion of posicionesBlindadas(total)) {
        expect(bloqueDePosicion(posicion, total)).toBe('Baja')
      }
    }
  })

  it('sitúa las cabezas de bloque según el reparto', () => {
    expect(posicionesCabezaDeBloque(15)).toEqual([1, 6, 11])
    expect(posicionesCabezaDeBloque(7)).toEqual([1, 4, 6])
    expect(posicionesCabezaDeBloque(1)).toEqual([1])
  })
})

describe('bloqueDePosicion', () => {
  it('reparte los 15 distritos en tercios de 5', () => {
    const bloques = Array.from({ length: 15 }, (_, i) => bloqueDePosicion(i + 1))
    expect(bloques.filter((b) => b === 'Alta')).toHaveLength(5)
    expect(bloques.filter((b) => b === 'Media')).toHaveLength(5)
    expect(bloques.filter((b) => b === 'Baja')).toHaveLength(5)
    expect(bloques[0]).toBe('Alta')
    expect(bloques[5]).toBe('Media')
    expect(bloques[10]).toBe('Baja')
  })
})

describe('competitividad individual', () => {
  it('ordena de mayor a menor porcentaje sin huecos ni repeticiones', () => {
    for (const { id_partido } of PARTIDOS) {
      const tabla = competitividad(individual(id_partido))
      expect(tabla).toHaveLength(15)
      expect(tabla.map((c) => c.posicion_rentabilidad)).toEqual(
        Array.from({ length: 15 }, (_, i) => i + 1),
      )
      expect(new Set(tabla.map((c) => c.id_distrito)).size).toBe(15)
      if (!tieneHistorial(id_partido)) continue
      const porcentajes = tabla.map((c) => c.porcentaje)
      expect(porcentajes.every((p) => p !== null)).toBe(true)
      expect([...porcentajes].sort((a, b) => b! - a!)).toEqual(porcentajes)
    }
  })

  it('sin historial ordena por número de distrito, no por votación', () => {
    // No hay porcentaje con el que construir un ranking, así que el orden es el
    // ascendente: I, II, III… y ningún distrito queda en un bloque.
    const tabla = competitividad(individual(PARTIDO.PESD))
    expect(tabla.map((c) => c.id_distrito)).toEqual(Array.from({ length: 15 }, (_, i) => i + 1))
    expect(tabla.every((c) => c.bloque === null)).toBe(true)
    expect(tabla.every((c) => c.porcentaje === null)).toBe(true)
  })

  it('usa el porcentaje individual tal cual lo aprobó el Consejo General', () => {
    const morena = competitividad(individual(PARTIDO.MORENA))
    expect(morena[0]).toMatchObject({ id_distrito: 10, porcentaje: 53.58, bloque: 'Alta' })
    expect(morena.at(-1)).toMatchObject({ id_distrito: 5, porcentaje: 25.79, bloque: 'Baja' })
  })

  it('produce rankings distintos por partido: el mismo distrito cambia de bloque', () => {
    const posicionDe = (partido: IdPartido, distrito: number) =>
      competitividad(individual(partido)).find((c) => c.id_distrito === distrito)!
    // El Distrito XV es el más rentable del PRI y casi el peor de MC.
    expect(posicionDe(PARTIDO.PRI, 15)).toMatchObject({ posicion_rentabilidad: 1, bloque: 'Alta' })
    expect(posicionDe(PARTIDO.MC, 15)).toMatchObject({ posicion_rentabilidad: 14, bloque: 'Baja' })
  })

  it('deja el Distrito XV en posición blindada para PAN y MC', () => {
    // Cruce relevante: ahí la fórmula indígena es obligatoria y las mujeres,
    // imposibles. El motor de reglas tiene que explicar las dos cosas.
    for (const partido of [PARTIDO.PAN, PARTIDO.MC] as const) {
      const xv = competitividad(individual(partido)).find((c) => c.id_distrito === 15)!
      expect(xv.posicion_rentabilidad).toBe(14)
    }
  })
})

describe('competitividad en coalición', () => {
  it('suma los porcentajes individuales y vuelve a ordenar', () => {
    const alianza = competitividad(coalicion(PARTIDO.PT, PARTIDO.PVEM, PARTIDO.MORENA))
    const distrito1 = alianza.find((c) => c.id_distrito === 1)!
    // PT 6.44 + PVEM 5.25 + MORENA 27.73
    expect(distrito1.porcentaje).toBeCloseTo(39.42, 4)
    expect(alianza).toHaveLength(15)
    expect(alianza.map((c) => c.posicion_rentabilidad)).toEqual(
      Array.from({ length: 15 }, (_, i) => i + 1),
    )
  })

  it('reordena los bloques respecto a los rankings individuales', () => {
    const solo = competitividad(individual(PARTIDO.PVEM))
    const aliado = competitividad(coalicion(PARTIDO.PT, PARTIDO.PVEM, PARTIDO.MORENA))
    const posicion = (tabla: typeof solo, distrito: number) =>
      tabla.find((c) => c.id_distrito === distrito)!.posicion_rentabilidad
    // El D-XIV es el mejor distrito del PVEM solo, pero no de la alianza.
    expect(posicion(solo, 14)).toBe(1)
    expect(posicion(aliado, 14)).not.toBe(1)
  })

  it('es indiferente al orden en que se listan los integrantes', () => {
    expect(competitividad(coalicion(PARTIDO.PT, PARTIDO.PVEM, PARTIDO.MORENA))).toEqual(
      competitividad(coalicion(PARTIDO.MORENA, PARTIDO.PT, PARTIDO.PVEM)),
    )
  })

  it('rechaza postulantes mal formados', () => {
    expect(() => competitividad({ integrantes: [], modalidad: 'Individual' })).toThrow()
    expect(() => competitividad(coalicion(PARTIDO.PAN, PARTIDO.PAN))).toThrow(/repetidos/)
    expect(() => competitividad(coalicion(PARTIDO.PAN))).toThrow(/dos partidos/)
    expect(() => competitividad({ integrantes: [PARTIDO.PAN, PARTIDO.PRI], modalidad: 'Individual' })).toThrow()
  })
})

describe('tableroInicial', () => {
  it('cruza geografía con competitividad y arranca sin asignaciones', () => {
    const tablero = tableroInicial(individual(PARTIDO.PRI))
    expect(tablero).toHaveLength(15)
    expect(tablero[0]).toMatchObject({
      numero_romano: 'XV',
      cabecera: 'Pueblo Nuevo',
      mayoria_indigena: true,
      posicion_rentabilidad: 1,
      bloque: 'Alta',
      postulacion: { modo: 'convenio', partido: PARTIDO.PRI, formula: null },
    })
  })

  it('deja el siglado sin decidir en coalición, porque se define en la Fase 1', () => {
    for (const distrito of tableroInicial(coalicion(PARTIDO.PAN, PARTIDO.PRI))) {
      expect(distrito.postulacion).toEqual({ modo: 'sin-decidir' })
    }
  })
})
