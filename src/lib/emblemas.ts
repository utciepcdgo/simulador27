import type { IdPartido } from '../domain/types'

/**
 * Color de marca de cada emblema, para teñir la interfaz.
 *
 * **Curado a mano, y a propósito.** Se intentó derivarlo de los SVG y no es
 * fiable: cuatro de los once —PVEM, PT, MC y MORENA— son exportaciones de
 * Illustrator que llevan dentro los once emblemas en capas, con las inactivas en
 * `display:none`. Su bloque de estilos declara los 43 colores del documento, así
 * que cuál pertenece al emblema visible solo se sabe recorriendo el marcado, no
 * el CSS. Con once partidos fijos durante todo el proceso, un dato curado y
 * auditable vale más que un analizador frágil que falle en silencio.
 *
 * Cada valor está tomado de la paleta que declara el propio archivo del partido.
 *
 * Es dato de presentación, no de dominio: el catálogo guarda identidad —orden de
 * registro, siglas, nombre— y aquí vive cómo se pinta.
 */
export const COLOR_EMBLEMA: Record<IdPartido, string> = {
  1: '#0055B8', // PAN — azul
  2: '#f42c20', // PRI — verde de la banda
  3: '#00AF41', // PVEM — verde
  4: '#E30613', // PT — rojo
  5: '#F08019', // MC — naranja
  6: '#B11F19', // MORENA — guinda
  7: '#662977', // PESD — morado
  8: '#66CDEE', // PV — azul cielo
  9: '#00BAB4', // PER — turquesa
  10: '#682575', // PAZ — morado
  11: '#E2057C', // SOMOS — magenta
}

/**
 * Capas de tinte para el fondo del encabezado.
 *
 * Un halo por integrante, repartidos a lo ancho y anclados por encima del borde
 * superior, de modo que solo entra en pantalla su mitad inferior. En coalición
 * los halos se mezclan donde se tocan, y la franja acaba diciendo de cuántos
 * partidos se compone la alianza sin escribir un número.
 *
 * Se devuelve como `background-image` y no como color sólido porque la opacidad
 * la decide quien lo pinta: el mismo tinte necesita menos presencia sobre papel
 * blanco que sobre fondo oscuro.
 */
export function tinteDeEmblemas(integrantes: readonly IdPartido[]): string {
  return integrantes
    .map((partido, i) => {
      const x = integrantes.length === 1 ? 50 : (i / (integrantes.length - 1)) * 100
      return `radial-gradient(56rem 20rem at ${x}% -8%, ${COLOR_EMBLEMA[partido]}, transparent 68%)`
    })
    .join(', ')
}
