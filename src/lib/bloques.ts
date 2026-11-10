import type { CSSProperties } from 'react'
import type { Bloque } from '../domain/types'

/**
 * El acento de cada bloque de competitividad.
 *
 * Es una **escala de intensidad**, no un semáforo: Alta queda densa y Baja
 * tenue, en la misma dirección en que cae el porcentaje de votación. Lo que se
 * codifica es un orden —los tramos 1-5, 6-10 y 11-15 de un ranking—, y un
 * semáforo codificaría un juicio que el dato no tiene: un tablero puede estar
 * perfectamente mal en el bloque Alto.
 *
 * El tono lo pone el partido dueño del tablero; la escala, el bloque. Un solo
 * color recorriendo tres intensidades sigue leyéndose como orden, que es lo que
 * un verde-ámbar-rojo nunca consigue.
 *
 * Los valores viven en `index.css`, donde está escrito por qué el rojo no puede
 * usarse aquí. El acento nunca es la única señal: cada bloque lleva su nombre y
 * su rango de posiciones en el encabezado.
 *
 * Vive en un solo sitio porque antes vivía en dos —el tablero y las miniaturas
 * del tutorial tenían cada uno su copia—, y dos copias de una tabla de color
 * acaban divergiendo.
 */
export const ACENTO_BLOQUE: Record<Bloque, { punto: string }> = {
  Alta: { punto: 'bg-bloque-alta' },
  Media: { punto: 'bg-bloque-media' },
  Baja: { punto: 'bg-bloque-baja' },
}

/**
 * Dónde cae cada bloque dentro de la escala, en porcentaje del acento.
 *
 * El salto de Alta a Media es mayor que el de Media a Baja, y es a propósito:
 * el bloque Alto es el de los distritos más rentables, el que primero se mira,
 * y una progresión lineal lo dejaba demasiado cerca del siguiente. La línea de
 * Alta ya va al color puro, así que el énfasis solo puede crecer por la banda.
 *
 * El techo lo marca el contraste del encabezado, que se lee sobre ella: a 25%
 * el peor de los once emblemas todavía da 9.7:1, de modo que 20 deja margen.
 */
const ESCALA: Record<Bloque, { linea: number; fondo: number }> = {
  Alta: { linea: 100, fondo: 20 },
  Media: { linea: 65, fondo: 8 },
  Baja: { linea: 35, fondo: 4 },
}

/** Los tokens acromáticos, para cuando el ámbito no es de un partido. */
const TOKEN: Record<Bloque, { linea: string; fondo: string }> = {
  Alta: { linea: 'var(--bloque-alta)', fondo: 'var(--bloque-alta-suave)' },
  Media: { linea: 'var(--bloque-media)', fondo: 'var(--bloque-media-suave)' },
  Baja: { linea: 'var(--bloque-baja)', fondo: 'var(--bloque-baja-suave)' },
}

/**
 * La regla superior y la banda de un bloque, teñidas con el color del partido.
 *
 * `color` es el de su emblema, o `null` en el tablero del convenio: ese no es de
 * nadie, y mezclar los colores de la alianza produciría uno que no es el de
 * ningún partido. Ahí sigue mandando la escala acromática, de modo que el color
 * pasa a significar «este tablero es de un partido concreto».
 *
 * La intensidad se mezcla contra `--card` y no contra blanco, que es lo que
 * mantiene viva la escala en tema oscuro sin una segunda tabla de valores: al
 * cambiar el tema cambia el fondo con el que se mezcla, y el acento se recompone
 * solo.
 *
 * Son estilos en línea y no clases porque el color depende del partido, y
 * Tailwind no puede generar una clase por cada uno de los once.
 */
export function acentoDeBloque(bloque: Bloque, color: string | null): CSSProperties {
  if (color === null) {
    return { borderTopColor: TOKEN[bloque].linea, backgroundColor: TOKEN[bloque].fondo }
  }
  const { linea, fondo } = ESCALA[bloque]
  return {
    borderTopColor: `color-mix(in oklab, ${color} ${linea}%, var(--card))`,
    backgroundColor: `color-mix(in oklab, ${color} ${fondo}%, var(--card))`,
  }
}

/** `#1-5`, o `#3` cuando el bloque lleva un solo distrito. */
export function rotuloRango(rango: [number, number]): string {
  const [desde, hasta] = rango
  return desde === hasta ? `#${desde}` : `#${desde}-${hasta}`
}
