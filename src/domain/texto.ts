/**
 * Concordancia de número para los textos que el motor emite.
 *
 * Existe porque el modelo de redacción de la interfaz lo exige —«el singular y
 * el plural se resuelven siempre: *1 correo no se envió* / *37 correos no se
 * enviaron*, nunca *1 correo(s)*»— y porque escribir `distrito(s)` en cada
 * mensaje era la salida fácil que ya se había repetido doce veces.
 *
 * Vive en `domain/` y no en un componente porque quien redacta estos textos es
 * el motor de reglas: un dictamen impreso en PDF lleva las mismas frases que la
 * pantalla, y la concordancia no puede depender de quién las pinte.
 */

/**
 * `1 distrito` / `4 distritos`, con el número delante.
 *
 * @example plural(1, 'distrito', 'distritos') // «1 distrito»
 */
export function plural(cuantos: number, singular: string, plural: string): string {
  return `${cuantos} ${cuantos === 1 ? singular : plural}`
}

/**
 * Lo mismo sin el número: sirve cuando la cifra ya salió antes en la frase.
 *
 * @example `${a} de ${b} ${concuerda(b, 'bloque', 'bloques')}`
 */
export function concuerda(cuantos: number, singular: string, plural: string): string {
  return cuantos === 1 ? singular : plural
}
