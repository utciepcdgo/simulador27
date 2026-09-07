import { create } from 'zustand'
import type { Ambito } from '../domain/reglas'

interface Navegacion {
  /**
   * Etiqueta del tablero abierto en la Fase 2.
   *
   * Vive fuera de `FaseMayoria` porque los controles de llenado —que están en
   * otra columna— actúan sobre el tablero que se está viendo. Era estado local
   * hasta que dejó de tener un solo lector.
   */
  tablero: string | null
  abrirTablero: (etiqueta: string) => void
}

export const useNavegacion = create<Navegacion>()((set) => ({
  tablero: null,
  abrirTablero: (etiqueta) => set({ tablero: etiqueta }),
}))

/**
 * El tablero abierto, o el primero si el guardado ya no existe.
 *
 * El conjunto de pestañas cambia al repartir el convenio: si la que estaba
 * abierta desaparece —la coalición pasó a total— se vuelve a la primera. Vive
 * aquí y no en el componente porque quien pinta las pestañas y quien las usa
 * para llenar el tablero son dos, y tienen que resolverlo igual.
 */
export function tableroVigente(
  tableros: readonly Ambito[],
  abierto: string | null,
): Ambito | undefined {
  return tableros.find((a) => a.etiqueta === abierto) ?? tableros[0]
}
