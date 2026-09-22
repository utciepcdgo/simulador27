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
   * Ocurre en tableros de 5, 7, 8 y 11 distritos. En el de 11, por ejemplo, el
   * bloque bajo queda impar y es el único, así que el artículo 28.5 le exige
   * mayoría de fórmulas encabezadas por mujeres mientras el 28.2 cierra a las
   * mujeres las posiciones que harían falta. Ningún acomodo lo resuelve.
   *
   * Las tres lecturas contestan la misma pregunta y por eso son un solo
   * criterio: dos criterios separados admitirían combinarlas, y «repórtalo como
   * incumplimiento» y «evita que ocurra» no se pueden sostener a la vez.
   *
   * - `reportar` — el motor lo reporta como incumplimiento, aunque no haya
   *   jugada que lo repare. Deja la contradicción a la vista.
   * - `inaplicable` — el motor tiene por no exigible **la regla que no se puede
   *   cumplir**, apoyándose en el «y en lo que resulte aplicable» del artículo
   *   27, numeral 1, punto V, y **lo dice**: la regla sigue apareciendo en el
   *   dictamen con la explicación. Una regla que se esfuma en silencio es peor
   *   que una que se contradice.
   * - `blindajeProporcional` — el motor gradúa **la prohibición del 28.2**, que
   *   es la que colisiona, en vez de dispensar la regla que colisiona con ella.
   *   Se apoya en la otra mitad del mismo punto V, «en proporción al número de
   *   distritos que integre cada bloque»: el piso de paridad del 23.1 y la
   *   mayoría en bloques impares del 28.4 y 28.5 no ceden, y el blindaje se
   *   aplica con la mayor extensión que quepa sin volver imposible el ámbito.
   *   Nunca cierra más de las dos posiciones que el 28.2 nombra, y **jamás
   *   cierra una que la lectura literal deje abierta**: solo puede permitir.
   *
   *   La comprobación que lo sostiene está en `holgura.test.ts`: con seis
   *   distritos el cálculo llega por su cuenta a un solo distrito cerrado, que
   *   es lo que el artículo 28.7 manda por escrito para ese caso exacto.
   */
  aritmeticaImposible: 'reportar' | 'inaplicable' | 'blindajeProporcional'

  /**
   * A quién alcanza la prohibición del artículo 28.2.
   *
   * El 28.2 dice que «en ningún caso se podrán postular **candidaturas del
   * género femenino**» en los distritos de menor porcentaje de votación. Los
   * Lineamientos tienen dos frases precisas para esto y ahí no usan ninguna:
   * cuando quieren decir la propietaria dicen «encabezada por una mujer» —el
   * 53.2, y el 28.4 y 28.5 dicen «fórmulas encabezadas por mujeres»—, y cuando
   * quieren alcanzar a las dos integrantes lo dicen —«tanto la persona
   * propietaria como la suplente», el 54.1—. El 28.2 dice una tercera cosa, más
   * amplia.
   *
   * - `candidatura` — cualquier mujer de la fórmula, propietaria o suplente. Es
   *   la lectura literal: una suplente es una candidata registrada como tal, y
   *   el «en ningún caso» no distingue el cargo. Cierra esas posiciones a las
   *   fórmulas `H-M` y `NB-M`.
   * - `propietaria` — solo quien encabeza. Se apoya en el artículo 21.1, que
   *   describe el daño como postular «de forma exclusiva de mujeres en los
   *   distritos de menor votación»: quien compite es la propietaria, y la
   *   suplente no compite, sustituye.
   *
   * No cambia ninguna cuenta de paridad, que sigue siendo por quien encabeza.
   * Solo cambia qué emparejamientos admiten esas una o dos casillas.
   */
  alcanceMenorVotacion: 'candidatura' | 'propietaria'
}

/** Lo que corre en producción. Cambiarlo es una decisión jurídica, no técnica. */
export const CRITERIOS_LEY: Criterios = {
  denominadorParidad: 'ambito',
  aritmeticaImposible: 'reportar',
  alcanceMenorVotacion: 'candidatura',
}

/**
 * Cómo se nombra cada criterio en pantalla.
 *
 * Vive aquí y no en el componente porque el mismo rótulo aparece en dos sitios
 * —la configuración y la insignia del dictamen— y dos copias acabarían
 * discrepando. El identificador del código no se muestra nunca.
 */
export const NOMBRE_CRITERIO: Record<keyof Criterios, string> = {
  denominadorParidad: 'Universo que mide la paridad global',
  alcanceMenorVotacion: 'Alcance de la prohibición en distritos de menor votación',
  aritmeticaImposible: 'Requisito imposible por la geometría del ámbito',
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
