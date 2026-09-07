import type { AccionAfirmativa, Genero, TokenFormula } from '../../domain/types'

let contador = 0

/**
 * Fórmula de ejemplo para las miniaturas del recorrido.
 *
 * Vive en su propio módulo y no junto a las piezas visuales porque no es un
 * componente: mezclarlos rompe el recambio en caliente de Vite, que necesita que
 * un archivo exporte componentes o valores, no las dos cosas.
 */
export function formulaDemo(
  propietario: Genero,
  suplente: Genero = propietario,
  extras: { esJoven?: boolean; accionAfirmativa?: AccionAfirmativa } = {},
): TokenFormula {
  contador += 1
  const perfil = (genero: Genero) => ({
    genero,
    esJoven: extras.esJoven ?? false,
    accionAfirmativa: extras.accionAfirmativa ?? ('Ninguna' as const),
  })
  return { id: `demo-${contador}`, propietario: perfil(propietario), suplente: perfil(suplente) }
}
