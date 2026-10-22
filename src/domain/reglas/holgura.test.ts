import { describe, expect, it } from 'vitest'
import { BLOQUES, posicionesBlindadas, tamanosDeBloque } from '../catalogo/rentabilidad'
import {
  blindajeFactible,
  minimoMujeres,
  posicionesBlindadasProporcionales,
  repartoMinimo,
  sinSolucionLiteral,
  type RepartoPorBloque,
} from './holgura'

/** Los quince tamaños que puede tener un ámbito, más el vacío. */
const TAMANOS = Array.from({ length: 16 }, (_, n) => n)

/**
 * Verificación independiente de que un reparto cumple los cuatro requisitos.
 *
 * Reescribe las restricciones desde el articulado en lugar de reutilizar las de
 * `holgura.ts`. Si las dos implementaciones comparten un error, esta prueba no
 * lo vería, y ese es justo el punto de no compartirlas.
 */
function infracciones(total: number, blindaje: number, reparto: RepartoPorBloque): string[] {
  const tamanos = tamanosDeBloque(total)
  const fallas: string[] = []

  // Artículo 23.1: por lo menos el 50% de fórmulas del género femenino.
  const suma = BLOQUES.reduce((acc, bloque) => acc + reparto[bloque], 0)
  if (suma < Math.ceil(total / 2)) fallas.push(`piso: ${suma} < ${Math.ceil(total / 2)}`)

  for (const bloque of BLOQUES) {
    const tamano = tamanos[bloque]
    const mujeres = reparto[bloque]
    const hombres = tamano - mujeres
    // Artículo 26.3: ningún género supera el tope del bloque.
    const tope = Math.ceil(tamano / 2)
    if (mujeres > tope) fallas.push(`${bloque}: ${mujeres} mujeres sobre un tope de ${tope}`)
    if (hombres > tope) fallas.push(`${bloque}: ${hombres} hombres sobre un tope de ${tope}`)
    if (mujeres < 0) fallas.push(`${bloque}: reparto negativo`)
  }

  // Artículo 28.2: las posiciones cerradas del bloque Bajo no llevan mujeres.
  const libresEnBaja = Math.max(0, tamanos.Baja - blindaje)
  if (reparto.Baja > libresEnBaja) {
    fallas.push(`Baja: ${reparto.Baja} mujeres en ${libresEnBaja} posición(es) abierta(s)`)
  }

  // Artículos 28.4 y 28.5: mayoría femenina en los bloques impares.
  const impares = BLOQUES.filter((bloque) => tamanos[bloque] % 2 === 1)
  const exigidas = impares.length === 3 ? 2 : impares.length > 0 ? 1 : 0
  const conMayoria = impares.filter(
    (bloque) => reparto[bloque] >= Math.floor(tamanos[bloque] / 2) + 1,
  ).length
  if (conMayoria < exigidas) fallas.push(`mayoría impar: ${conMayoria} de ${exigidas}`)

  return fallas
}

describe('holgura de un ámbito', () => {
  it('el piso del cincuenta por ciento no cambió al mudarse de archivo', () => {
    expect(TAMANOS.map(minimoMujeres)).toEqual([0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8])
  })

  it('cuántas posiciones cierra cada lectura, tamaño por tamaño', () => {
    // La tabla completa, que es el mapa del comportamiento y la referencia del
    // documento. La lectura literal es la columna `ley`; la proporcional solo
    // se aparta donde aquélla deja al ámbito sin ninguna composición válida.
    const tabla = TAMANOS.map((n) => ({
      n,
      ley: posicionesBlindadas(n).length,
      proporcional: blindajeFactible(n),
    }))
    expect(tabla).toEqual([
      { n: 0, ley: 0, proporcional: 0 },
      { n: 1, ley: 0, proporcional: 0 },
      { n: 2, ley: 0, proporcional: 0 },
      { n: 3, ley: 1, proporcional: 1 },
      { n: 4, ley: 1, proporcional: 1 },
      { n: 5, ley: 1, proporcional: 0 },
      { n: 6, ley: 1, proporcional: 1 },
      { n: 7, ley: 2, proporcional: 1 },
      { n: 8, ley: 2, proporcional: 1 },
      { n: 9, ley: 2, proporcional: 2 },
      { n: 10, ley: 2, proporcional: 2 },
      { n: 11, ley: 2, proporcional: 1 },
      { n: 12, ley: 2, proporcional: 2 },
      { n: 13, ley: 2, proporcional: 2 },
      { n: 14, ley: 2, proporcional: 2 },
      { n: 15, ley: 2, proporcional: 2 },
    ])
  })

  it('reproduce el artículo 28.7 sin tenerlo escrito', () => {
    // Con seis distritos los bloques quedan 2-2-2, que es el supuesto exacto del
    // 28.7: «en el último de éstos bloques no se deberá postular mujeres en el
    // último distrito de menor porcentaje de votación». Uno, no dos.
    //
    // `posicionesBlindadas` lo tiene escrito a mano porque el reglamento lo dice.
    // `blindajeFactible` no sabe nada de ese artículo: parte del blindaje general
    // de dos y comprueba si el ámbito conserva solución. Llega al mismo número.
    //
    // Es la única comprobación externa disponible para toda esta lectura: el
    // único tamaño parcial que el reglamento resuelve por escrito.
    expect(tamanosDeBloque(6)).toEqual({ Alta: 2, Media: 2, Baja: 2 })
    expect(repartoMinimo(6, 2)).toBeNull()
    expect(blindajeFactible(6)).toBe(1)
    expect(posicionesBlindadasProporcionales(6)).toEqual(posicionesBlindadas(6))
  })

  it('solo se aparta de la lectura literal donde ésta no tiene solución', () => {
    // La condición que vuelve legítima toda la operación: no es un dial que
    // afloje por comodidad, sino el mínimo aflojamiento que devuelve la solución.
    const apartados = TAMANOS.filter((n) => blindajeFactible(n) !== posicionesBlindadas(n).length)
    const sinSalida = TAMANOS.filter(sinSolucionLiteral)
    expect(apartados).toEqual(sinSalida)
  })

  it('los tamaños sin solución bajo la lectura literal son 5, 7, 8 y 11', () => {
    // Ocho está en la lista por el tope del 26.3 en su dirección menos evidente:
    // su bloque Bajo tiene dos distritos y la lectura literal los cierra los dos,
    // de modo que lleva forzosamente dos hombres cuando el máximo por género en
    // un bloque de dos es uno. No falla por falta de mujeres, sino por exceso de
    // hombres, y por eso una cuenta que solo mire el techo femenino no lo ve.
    expect(TAMANOS.filter(sinSolucionLiteral)).toEqual([5, 7, 8, 11])
    expect(repartoMinimo(8, 2)).toBeNull()
    expect(repartoMinimo(8, 1)).toEqual({ Alta: 1, Media: 2, Baja: 1 })
  })

  it('deja a todo tamaño con al menos una composición válida', () => {
    for (const n of TAMANOS) {
      const blindaje = blindajeFactible(n)
      const reparto = repartoMinimo(n, blindaje)
      expect(reparto, `ámbito de ${n} distritos`).not.toBeNull()
      expect(infracciones(n, blindaje, reparto!), `ámbito de ${n} distritos`).toEqual([])
    }
  })

  it('nunca cierra una posición que la lectura literal deje abierta', () => {
    // La garantía de seguridad del criterio: solo puede permitir, jamás prohibir.
    // Sin ella, activar una lectura de análisis podría rechazar una postulación
    // que la ley admite, que es el peor error que esta herramienta puede cometer.
    for (const n of TAMANOS) {
      const ley = posicionesBlindadas(n)
      const proporcional = posicionesBlindadasProporcionales(n)
      expect(ley, `ámbito de ${n} distritos`).toEqual(expect.arrayContaining(proporcional))
      expect(proporcional.length, `ámbito de ${n} distritos`).toBeLessThanOrEqual(ley.length)
    }
  })

  it('cierra siempre las posiciones de menor votación y nunca más de dos', () => {
    for (const n of TAMANOS) {
      const posiciones = posicionesBlindadasProporcionales(n)
      expect(posiciones.length, `ámbito de ${n} distritos`).toBeLessThanOrEqual(2)
      expect(posiciones.length, `ámbito de ${n} distritos`).toBeLessThanOrEqual(
        tamanosDeBloque(n).Baja,
      )
      // Contiguas y pegadas al final del ámbito: son «los últimos distritos de
      // menor porcentaje de votación», no un conjunto cualquiera.
      expect(posiciones, `ámbito de ${n} distritos`).toEqual(
        Array.from({ length: posiciones.length }, (_, i) => n - posiciones.length + 1 + i),
      )
    }
  })

  it('rechaza todo reparto que infrinja alguna de las cuatro reglas', () => {
    // Contraprueba del verificador: si `infracciones` diera siempre vacío, la
    // prueba anterior pasaría sin comprobar nada.
    expect(infracciones(15, 2, { Alta: 5, Media: 3, Baja: 3 })).toContain(
      'Alta: 5 mujeres sobre un tope de 3',
    )
    expect(infracciones(15, 2, { Alta: 0, Media: 0, Baja: 0 })).toContain('piso: 0 < 8')
    expect(infracciones(15, 3, { Alta: 3, Media: 3, Baja: 3 })).toContain(
      'Baja: 3 mujeres en 2 posición(es) abierta(s)',
    )
    expect(infracciones(5, 1, { Alta: 1, Media: 1, Baja: 0 })).toContain('mayoría impar: 0 de 1')
  })

  it('no toca el ámbito vacío ni aquel cuyo bloque Bajo no existe', () => {
    // Con uno o dos distritos el reparto del artículo 27 deja el bloque Bajo sin
    // ninguno, y la prohibición del 28.2 no tiene dónde operar.
    expect(tamanosDeBloque(2).Baja).toBe(0)
    expect(posicionesBlindadasProporcionales(0)).toEqual([])
    expect(posicionesBlindadasProporcionales(2)).toEqual([])
  })
})
