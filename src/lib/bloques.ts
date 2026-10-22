import type { Bloque } from '../domain/types'

/**
 * El acento de cada bloque de competitividad.
 *
 * Es una **escala por luminosidad**, no un semáforo: Alta queda densa y Baja
 * tenue, en la misma dirección en que cae el porcentaje de votación. Lo que se
 * codifica es un orden —los tramos 1-5, 6-10 y 11-15 de un ranking—, y un
 * semáforo codificaría un juicio que el dato no tiene: un tablero puede estar
 * perfectamente mal en el bloque Alto.
 *
 * Los valores viven en `index.css`, donde está escrito por qué el rojo no puede
 * usarse aquí. El acento nunca es la única señal: cada bloque lleva su nombre y
 * su rango de posiciones en el encabezado.
 *
 * Vive en un solo sitio porque antes vivía en dos —el tablero y las miniaturas
 * del tutorial tenían cada uno su copia—, y dos copias de una tabla de color
 * acaban divergiendo.
 */
export const ACENTO_BLOQUE: Record<Bloque, { regla: string; fondo: string; punto: string }> = {
  Alta: {
    regla: 'border-t-bloque-alta',
    fondo: 'bg-bloque-alta-suave',
    punto: 'bg-bloque-alta',
  },
  Media: {
    regla: 'border-t-bloque-media',
    fondo: 'bg-bloque-media-suave',
    punto: 'bg-bloque-media',
  },
  Baja: {
    regla: 'border-t-bloque-baja',
    fondo: 'bg-bloque-baja-suave',
    punto: 'bg-bloque-baja',
  },
}

/** `#1-5`, o `#3` cuando el bloque lleva un solo distrito. */
export function rotuloRango(rango: [number, number]): string {
  const [desde, hasta] = rango
  return desde === hasta ? `#${desde}` : `#${desde}-${hasta}`
}
