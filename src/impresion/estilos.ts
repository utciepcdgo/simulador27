import { StyleSheet } from '@react-pdf/renderer'

/**
 * La hoja de estilos del papel.
 *
 * No hereda nada de la pantalla y no debería: una tabla a ocho puntos sobre
 * blanco no se compone como una tarjeta arrastrable sobre una superficie que
 * cambia de tema. Lo único que las dos superficies comparten son las cifras, que
 * salen del mismo motor.
 *
 * Todo en puntos, que es la unidad del PDF. Carta vertical mide 612 × 792, y con
 * los márgenes laterales quedan 528 puntos de justificación.
 */
export const TINTA = '#1c1c1c'
export const SUAVE = '#6d6d6d'
export const LINEA = '#d5d5d5'

/**
 * Alto del membrete y del pie, que se repiten en cada hoja.
 *
 * Van fijos y no ajustados al contenido: una caja absoluta sin alto no la coloca
 * `react-pdf` —el pie desaparecía entero de las cuatro páginas—. Lo que hay que
 * cuidar es que quepa lo que llevan dentro, o lo recortan con puntos
 * suspensivos: el nombre del Instituto ocupa dos renglones a ocho puntos y la
 * advertencia del centro, tres.
 */
export const ALTO_ENCABEZADO = 40
export const ALTO_PIE = 42

export function estilos(familia: 'Roboto' | 'Helvetica') {
  // Helvetica no tiene pesos intermedios: su único ascenso es la negrita.
  const medio = familia === 'Roboto' ? 500 : 700
  return StyleSheet.create({
    pagina: {
      fontFamily: familia,
      fontSize: 8.5,
      color: TINTA,
      // Ni un `lineHeight` en toda la hoja, y es deliberado.
      //
      // Medido sobre el flujo del PDF: en `react-pdf` la propiedad no escala la
      // línea de la tipografía, multiplica una base fija de 18 puntos. A cuerpo
      // 8.5 la separación natural entre renglones es de 10 puntos —la correcta—;
      // declarar 1 la sube a 18, y 1.4 a 25.2, casi el triple. De ahí venían los
      // párrafos abiertos y los emblemas que parecían despegados de su nombre:
      // un emblema de 10 puntos centrado en un renglón de 25 deja siete y medio
      // de aire arriba y abajo.
      //
      // Como efecto secundario desaparece la trampa que dejaba el documento sin
      // numerar: un `lineHeight` heredado apaga en silencio el `render` que
      // resuelve «Página X de Y», y ya no hay ninguno que pueda heredarse.
      paddingTop: ALTO_ENCABEZADO + 24,
      paddingBottom: ALTO_PIE + 20,
      paddingHorizontal: 42,
    },

    // ── Membrete ────────────────────────────────────────────────────────────
    encabezado: {
      position: 'absolute',
      top: 24,
      left: 42,
      right: 42,
      height: ALTO_ENCABEZADO,
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: 0.75,
      borderBottomColor: LINEA,
      paddingBottom: 8,
    },
    // Sin plancha: el archivo trae fondo transparente y el papel ya es blanco.
    // La caja blanca de la pantalla existe solo para el tema oscuro.
    logotipo: { height: 26, width: 58, objectFit: 'contain' },
    divisor: { width: 0.75, height: 26, backgroundColor: LINEA, marginHorizontal: 12 },
    titulo: { fontSize: 11.5, fontWeight: medio, letterSpacing: -0.2 },
    subtitulo: { fontSize: 7, color: SUAVE, letterSpacing: 0.6, textTransform: 'uppercase' },
    fecha: { marginLeft: 'auto', fontSize: 8, color: SUAVE, textAlign: 'right' },

    // ── Pie ─────────────────────────────────────────────────────────────────
    pie: {
      position: 'absolute',
      bottom: 24,
      left: 42,
      right: 42,
      height: ALTO_PIE,
      flexDirection: 'row',
      alignItems: 'flex-start',
      borderTopWidth: 0.75,
      borderTopColor: LINEA,
      paddingTop: 6,
      fontSize: 8,
      color: SUAVE,
    },
    pieIzquierda: { width: '36%', paddingRight: 10 },
    pieCentro: { width: '42%', textAlign: 'center', paddingHorizontal: 6 },
    pieDerecha: { width: '22%', textAlign: 'right' },

    // ── Estructura ──────────────────────────────────────────────────────────
    seccion: { marginTop: 16 },
    rubro: {
      fontSize: 10,
      fontWeight: medio,
      borderBottomWidth: 0.75,
      borderBottomColor: TINTA,
      paddingBottom: 3,
      marginBottom: 7,
    },
    subrubro: { fontSize: 8.5, fontWeight: medio, marginTop: 9, marginBottom: 4 },
    /*
      Caja cuadrada, como los archivos: los once miden 97×97. Una caja más ancha
      que alta centraba cada emblema dentro de ella y dejaba seis puntos de aire
      antes del texto, que se leían como un emblema despegado de su partido.
      `objectFit` se queda por si algún día se repone uno con otra proporción:
      encajaría pequeño, no desbordado.
    */
    emblema: { height: 9, width: 9, objectFit: 'contain' },
    /* Dentro de una tabla el emblema se ciñe al cuerpo de 8 puntos. */
    emblemaChico: { height: 7.5, width: 7.5, objectFit: 'contain' },
    /* Rótulo con emblema delante: deja de ser una línea de texto y pasa a fila. */
    rubroConEmblema: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    celdaConEmblema: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    /*
      Cuando el rótulo se parte en varias líneas, el emblema se alinea con la
      primera y no con el centro del bloque: pertenece al nombre, no a la celda.
    */
    celdaConEmblemaAlta: { flexDirection: 'row', alignItems: 'flex-start', gap: 3 },
    nota: { fontSize: 7.5, color: SUAVE, marginTop: 4 },
    parrafo: { marginBottom: 5 },

    // ── Fichas de identificación ────────────────────────────────────────────
    ficha: { flexDirection: 'row', marginBottom: 2 },
    fichaRotulo: { width: 96, color: SUAVE },
    fichaValor: { flex: 1, fontWeight: medio },

    // ── Tablas ──────────────────────────────────────────────────────────────
    cabecera: {
      flexDirection: 'row',
      borderBottomWidth: 0.75,
      borderBottomColor: TINTA,
      paddingBottom: 2.5,
      fontSize: 7,
      color: SUAVE,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    fila: {
      flexDirection: 'row',
      borderBottomWidth: 0.5,
      borderBottomColor: LINEA,
      paddingVertical: 2.5,
      fontSize: 8,
    },
    /* Un hallazgo del dictamen: el ámbito a la izquierda y lo que arrojó. */
    hallazgo: { flexDirection: 'row', marginBottom: 2 },
    hallazgoAmbito: { width: '32%', paddingRight: 6, fontSize: 8, color: SUAVE },
    hallazgoMensaje: { flex: 1, fontSize: 8 },
    tenue: { color: SUAVE },
    destacado: { fontWeight: medio },
  })
}

export type Estilos = ReturnType<typeof estilos>
