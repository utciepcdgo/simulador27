/**
 * Si la herramienta se presenta como proyecto en curso.
 *
 * Una sola lectura de la variable, en un solo sitio: `import.meta.env` entrega
 * cadenas, y repartir la comparación con `'true'` por los componentes
 * garantizaba que alguno acabara evaluando `'false'` como verdadero.
 *
 * Vite sustituye la expresión en tiempo de compilación, así que con el modo
 * apagado la trama y su marcado desaparecen del paquete.
 */
export const MODO_PROYECTO = import.meta.env.PROJECT_MODE === 'true'
