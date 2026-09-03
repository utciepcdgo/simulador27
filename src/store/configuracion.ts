import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CRITERIOS_LEY, type Criterios } from '../domain/reglas'

/**
 * Si la capa de criterios de interpretación está disponible.
 *
 * Solo en desarrollo. **En producción el simulador es un reflejo de la ley**:
 * corre siempre con `CRITERIOS_LEY` y no hay interruptor que lo cambie, ni
 * siquiera uno guardado de antes. Un dictamen que circula por correo tiene que
 * significar lo mismo para todo el mundo.
 */
export const MODO_DESARROLLO = import.meta.env.DEV

/**
 * Preferencias de la interfaz.
 *
 * Persisten en el navegador, a diferencia del escenario que se arma en el
 * tablero: la primera consideración promete que nada de lo que la persona
 * usuaria ingrese se almacena, y eso habla de las fórmulas y del convenio, no de
 * cómo quiere ver la herramienta.
 */
export interface Opciones {
  /**
   * Muestra en la Fase 2 el porcentaje de votación que sustenta cada posición de
   * rentabilidad: la suma de la alianza en el tablero del convenio, y el
   * porcentaje individual del partido en el suyo. Un partido de registro nuevo
   * no compitió en 2023-2024 y aparece con 0% en los quince distritos.
   */
  mostrarRentabilidad: boolean
  /**
   * Muestra en cada distrito del tablero del convenio las siglas del partido al
   * que se le atribuyó.
   *
   * Solo tiene efecto en coalición y candidatura común: es donde el siglado
   * existe como decisión. En postulación individual no hay nada que atribuir, y
   * en los tableros de distritos fuera del convenio la pestaña ya dice de quién
   * son.
   */
  mostrarSiglado: boolean
}

const INICIALES: Opciones = {
  mostrarRentabilidad: false,
  mostrarSiglado: false,
}

interface Configuracion {
  opciones: Opciones
  /**
   * Lecturas alternativas de los artículos ambiguos. Se guardan aquí, pero solo
   * `criteriosVigentes` decide cuáles rigen de verdad.
   */
  criterios: Criterios
  establecer: <K extends keyof Opciones>(opcion: K, valor: Opciones[K]) => void
  elegirCriterio: <K extends keyof Criterios>(criterio: K, valor: Criterios[K]) => void
}

export const useConfiguracion = create<Configuracion>()(
  persist(
    (set) => ({
      opciones: INICIALES,
      criterios: CRITERIOS_LEY,
      establecer: (opcion, valor) =>
        set((estado) => ({ opciones: { ...estado.opciones, [opcion]: valor } })),
      elegirCriterio: (criterio, valor) =>
        set((estado) => ({ criterios: { ...estado.criterios, [criterio]: valor } })),
    }),
    {
      name: 'simulador27:configuracion',
      partialize: (estado) => ({ opciones: estado.opciones, criterios: estado.criterios }),
      // Una preferencia guardada antes de que existiera una opción nueva no la
      // trae; sin este merge llegaría como `undefined` en vez de su valor
      // inicial, y la opción parecería apagada sin estarlo.
      merge: (persistido, actual) => {
        const guardado = persistido as
          | { opciones?: Partial<Opciones>; criterios?: Partial<Criterios> }
          | undefined
        return {
          ...actual,
          opciones: { ...actual.opciones, ...guardado?.opciones },
          // En producción se descarta lo guardado: los criterios de la ley no se
          // heredan de una sesión de desarrollo ni de un navegador ajeno.
          criterios: MODO_DESARROLLO
            ? { ...actual.criterios, ...guardado?.criterios }
            : CRITERIOS_LEY,
        }
      },
    },
  ),
)

/**
 * Los criterios que rigen el dictamen ahora mismo.
 *
 * Es el **único** punto por el que los criterios llegan al motor. Fuera de
 * desarrollo devuelve la ley sin mirar el estado guardado, de modo que no exista
 * ninguna ruta —ni un `localStorage` copiado— capaz de alterar un dictamen de
 * producción.
 */
export function useCriterios(): Criterios {
  const criterios = useConfiguracion((c) => c.criterios)
  return MODO_DESARROLLO ? criterios : CRITERIOS_LEY
}
