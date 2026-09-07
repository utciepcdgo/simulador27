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
  /**
   * Muestra sobre la bandeja los controles de llenado rápido.
   *
   * Van apagados de origen y detrás de una opción porque tres de los cuatro
   * escriben sobre lo que ya está armado. Son andamio para probar el motor
   * deprisa, no parte del procedimiento de postulación.
   */
  mostrarLlenadoRapido: boolean
  /**
   * Permite pulsar una fórmula ya colocada para cambiar sus atributos.
   *
   * Va encendida de origen, a diferencia de las demás: no añade nada a la
   * pantalla ni escribe sobre lo armado, sino que ahorra el rodeo de devolver la
   * fórmula a la bandeja para corregirle un género. La opción está para poder
   * quitarla —apagada, la ficha vuelve a ser solo algo que se arrastra—.
   */
  mostrarEditorFormulas: boolean
  /**
   * Avisos sonoros de la interfaz: el rechazo de un movimiento y el cierre de la
   * postulación.
   *
   * Encendida de origen. Ninguno suena por su cuenta: los dos acompañan a algo
   * que la propia persona provocó y que ya está escrito en pantalla, y sirven de
   * canal redundante para quien no estaba mirando esa parte del tablero. La
   * opción existe para poder callarlos: en una sesión con público, un pitido
   * inesperado basta para que alguien apague los sonidos y no vuelva a
   * encenderlos.
   */
  sonidos: boolean
}

const INICIALES: Opciones = {
  mostrarRentabilidad: false,
  mostrarSiglado: false,
  mostrarLlenadoRapido: false,
  mostrarEditorFormulas: true,
  sonidos: true,
}

interface Configuracion {
  opciones: Opciones
  /**
   * Si el recorrido guiado ya se mostró en este navegador.
   *
   * Va fuera de `opciones` a propósito: no es una preferencia que alguien elija
   * en el diálogo de configuración, es una marca de que algo ya ocurrió. Mezclar
   * las dos cosas pondría en el catálogo una casilla que nadie querría marcar.
   */
  tutorialVisto: boolean
  /**
   * Lecturas alternativas de los artículos ambiguos. Se guardan aquí, pero solo
   * `criteriosVigentes` decide cuáles rigen de verdad.
   */
  criterios: Criterios
  establecer: <K extends keyof Opciones>(opcion: K, valor: Opciones[K]) => void
  marcarTutorialVisto: () => void
  elegirCriterio: <K extends keyof Criterios>(criterio: K, valor: Criterios[K]) => void
}

export const useConfiguracion = create<Configuracion>()(
  persist(
    (set) => ({
      opciones: INICIALES,
      tutorialVisto: false,
      criterios: CRITERIOS_LEY,
      establecer: (opcion, valor) =>
        set((estado) => ({ opciones: { ...estado.opciones, [opcion]: valor } })),
      marcarTutorialVisto: () => set({ tutorialVisto: true }),
      elegirCriterio: (criterio, valor) =>
        set((estado) => ({ criterios: { ...estado.criterios, [criterio]: valor } })),
    }),
    {
      name: 'simulador27:configuracion',
      partialize: (estado) => ({
        opciones: estado.opciones,
        tutorialVisto: estado.tutorialVisto,
        criterios: estado.criterios,
      }),
      // Una preferencia guardada antes de que existiera una opción nueva no la
      // trae; sin este merge llegaría como `undefined` en vez de su valor
      // inicial, y la opción parecería apagada sin estarlo.
      merge: (persistido, actual) => {
        const guardado = persistido as
          | {
              opciones?: Partial<Opciones>
              tutorialVisto?: boolean
              criterios?: Partial<Criterios>
            }
          | undefined
        return {
          ...actual,
          opciones: { ...actual.opciones, ...guardado?.opciones },
          tutorialVisto: guardado?.tutorialVisto ?? actual.tutorialVisto,
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
