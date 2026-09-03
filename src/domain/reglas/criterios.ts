/**
 * Criterios de interpretación: las bifurcaciones donde el texto admite más de
 * una lectura razonable y el motor tiene que elegir una para poder calcular.
 *
 * Existen porque callarlas sería peor. Hasta ahora cada una de estas decisiones
 * vivía escondida dentro de una función, sin que nadie pudiera verla ni
 * discutirla; ahora es un dato con nombre, con el artículo que interpreta al
 * lado, y con pruebas que corren las dos lecturas.
 *
 * **`CRITERIOS_LEY` es lo que corre en producción**, sin excepción y sin
 * interruptor. La capa que permite cambiarlos es una herramienta de análisis
 * para el área jurídica, no una opción de la aplicación: quien use el simulador
 * en el proceso debe obtener siempre el mismo dictamen para el mismo tablero.
 */
export interface Criterios {
  /**
   * Sobre qué universo se mide el cincuenta por ciento de un ámbito.
   *
   * Artículo 20.2: cada integrante «deberá garantizar su propia paridad global,
   * **sumando las candidaturas** de la coalición que le correspondan más sus
   * **registros** individuales fuera de ella».
   *
   * - `ambito` — todos los distritos del ámbito, se hayan ocupado o no. Da un
   *   objetivo estable desde el primer movimiento, pero infla el denominador de
   *   quien decide no contender en algunos distritos fuera del convenio: nada le
   *   obliga a postular en todos.
   * - `registradas` — solo las candidaturas efectivamente colocadas. Es lo que
   *   dicen las palabras del 20.2, y equivale a exigir que las mujeres no sean
   *   menos que los hombres. A cambio, mientras el tablero se arma el mínimo se
   *   mueve con cada ficha.
   */
  denominadorParidad: 'ambito' | 'registradas'

  /**
   * Qué hacer cuando un requisito no se puede satisfacer por la geometría del
   * propio ámbito, no por lo que se haya colocado.
   *
   * Ocurre en tableros de 5 y de 11 distritos: el bloque bajo queda impar y es
   * el único, así que el artículo 28.5 le exige mayoría de fórmulas encabezadas
   * por mujeres, mientras el 28.2 cierra a las mujeres las posiciones que harían
   * falta. Ningún acomodo lo resuelve.
   *
   * - `reportar` — el motor lo reporta como incumplimiento, aunque no haya
   *   jugada que lo repare. Deja la contradicción a la vista.
   * - `inaplicable` — el motor lo tiene por no exigible, apoyándose en el «y en
   *   lo que resulte aplicable» del artículo 27.4, y **lo dice**: la regla sigue
   *   apareciendo en el dictamen con la explicación. Una regla que se esfuma en
   *   silencio es peor que una que se contradice.
   */
  aritmeticaImposible: 'reportar' | 'inaplicable'
}

/** Lo que corre en producción. Cambiarlo es una decisión jurídica, no técnica. */
export const CRITERIOS_LEY: Criterios = {
  denominadorParidad: 'ambito',
  aritmeticaImposible: 'reportar',
}

/**
 * Criterios que no están en su valor de origen.
 *
 * Lo consume la insignia del dictamen: un dictamen calculado con una lectura
 * distinta a la de la ley tiene que decirlo en su propia cara, porque va a
 * circular como captura de pantalla sin la configuración que lo produjo.
 */
export function criteriosFueraDeLey(criterios: Criterios): (keyof Criterios)[] {
  return (Object.keys(CRITERIOS_LEY) as (keyof Criterios)[]).filter(
    (clave) => criterios[clave] !== CRITERIOS_LEY[clave],
  )
}
