# Tableros parciales: qué exige cada regla y dónde el reglamento calla

Cuando un partido, coalición o candidatura común no postula en los quince distritos, el artículo
27 ordena rearmar los bloques con **los distritos donde sí se vaya a postular**. Este documento
recorre los quince tamaños posibles y contesta, para cada uno, una sola pregunta:

> ¿Existe alguna composición del tablero que satisfaga a la vez las cuatro reglas que lo gobiernan?

Esas cuatro son el piso del 50% (artículo 23.1), el tope por género de cada bloque (26.3), la
mayoría femenina en bloques impares (28.4 y 28.5) y la prohibición en los distritos de menor
votación (28.2).

No es un ejercicio teórico. Un partido que quiera derecho a representación proporcional y nada
más registrará en **once** distritos, que es el mínimo del artículo 75, numeral 1, fracción I. Y
cada integrante de una coalición flexible en el mínimo se queda con un tablero individual de once.

## Cómo se produjo

Las cifras salen de ejecutar el propio motor, no de aritmética a mano. Concretamente de
`tamanosDeBloque(n)` para el reparto del artículo 27, `posicionesBlindadas(n)` para el 28.2, y
`repartoMinimo(n, blindaje)` de [`holgura.ts`](../src/domain/reglas/holgura.ts), que enumera todas
las composiciones posibles y devuelve la de menos mujeres que cumple las cuatro, o `null` si no
hay ninguna.

Todas están fijadas en `holgura.test.ts`, con un verificador que reescribe las cuatro
restricciones desde el articulado en vez de reutilizar las del módulo: si las dos
implementaciones compartieran un error, la prueba no lo vería, y ese es justo el motivo de no
compartirlas.

## Tabla maestra

| n | Bloques (art. 27) | Prohibidas (28.2) | Regla de mayoría | Piso (50%) | ¿Tiene solución? | Reparto mínimo | Cuota joven |
|--:|---|---|---|--:|---|---|--:|
| 1 | 1-0-0 | — | 28.5: Alta | 1 | sí | 1-0-0 | 0 |
| 2 | 1-1-0 | — | 28.5: Alta o Media | 1 | sí | 0-1-0 | 0 |
| 3 | 1-1-1 | 3 | 28.4: dos bloques | 2 | sí | 1-1-0 | 0 |
| 4 | 2-1-1 | 4 | 28.5: Media o Baja | 2 | sí | 1-1-0 | 0 |
| **5** | 2-2-1 | 5 | 28.5: **solo Baja** | 3 | **NO** | — | 0 |
| 6 | 2-2-2 | 6 | ninguna | 3 | sí | 1-1-1 | 0 |
| **7** | 3-2-2 | 6, 7 | 28.5: Alta | 4 | **NO** | — | 0 |
| **8** | 3-3-2 | 7, 8 | 28.5: Alta o Media | 4 | **NO** | — | 1 |
| 9 | 3-3-3 | 8, 9 | 28.4: dos bloques | 5 | sí | 2-2-1 | 1 |
| 10 | 4-3-3 | 9, 10 | 28.5: Media o Baja | 5 | sí | 2-2-1 | 1 |
| **11** | 4-4-3 | 10, 11 | 28.5: **solo Baja** | 6 | **NO** | — | 1 |
| 12 | 4-4-4 | 11, 12 | ninguna | 6 | sí | 2-2-2 | 1 |
| 13 | 5-4-4 | 12, 13 | 28.5: Alta | 7 | sí | 3-2-2 | 1 |
| 14 | 5-5-4 | 13, 14 | 28.5: Alta o Media | 7 | sí | 2-3-2 | 1 |
| 15 | 5-5-5 | 14, 15 | 28.4: dos bloques | 8 | sí | 2-3-3 | 1 |

El **reparto mínimo** es cuántas fórmulas encabezadas por mujeres lleva cada bloque en la
composición más económica que cumple. Donde dice NO, ninguna composición lo hace.

### Lo primero que salta

**Once de los quince tamaños tienen exactamente una salida**, sin un solo grado de libertad en la
cuenta: el reparto mínimo es el único posible. Solo en 2, 14 y 15 hay holgura. Un tablero parcial
no se «acomoda»: se resuelve o no se resuelve.

**Cuatro tamaños no tienen ninguna: 5, 7, 8 y 11.**

### Por qué el ocho estuvo mal clasificado

Hasta la revisión de septiembre de 2026 este documento daba el ocho por resuelto. Lo daba porque
medía la capacidad con un **techo**: cuántas fórmulas de mujeres caben como máximo, sumando por
bloque el menor entre su tope de género y los distritos que el 28.2 no cerró. Con ocho distritos
ese techo da cuatro y el piso pide cuatro, así que parecía exacto.

La cuenta miraba a un solo lado. El bloque bajo de un tablero de ocho tiene dos distritos y la
prohibición los cierra los dos, de modo que lleva forzosamente **dos hombres** cuando el máximo
por género en un bloque de dos es **uno**. El tablero no falla por falta de mujeres, sino por
exceso de hombres.

El motor siempre lo supo —`paridadBloques` rechaza que cualquiera de los dos géneros supere el
tope— y lo habría reportado. Era el documento el que no lo veía, porque el tope del artículo 26.3
es una restricción de dos caras y el techo solo miraba una. La tabla de ahora no usa techos: le
pregunta al motor si existe una composición.

## Un defecto del motor, ya corregido

El caso **n = 6** no era una laguna del reglamento: era un error del simulador, y tenía texto
expreso en contra.

> **Artículo 28.7.** En el caso de que los bloques de competitividad se integren por **dos
> distritos en cada bloque**, en el último de éstos bloques no se deberá postular mujeres en **el
> último distrito** de menor porcentaje de votación.

Bloques de dos distritos cada uno es exactamente 2-2-2, es decir, n = 6. Y el artículo prohíbe
**un** distrito, no dos. El motor cerraba los dos —posiciones 5 y 6—, con lo que el bloque bajo
quedaba sin ningún lugar para mujeres y ninguna composición cumplía.

`posicionesBlindadas` ya devuelve `[6]` en el reparto 2-2-2, y n = 6 pasó a resolverse con 1-1-1.

## La lectura proporcional del artículo 27, numeral 1, punto V

Es la respuesta que el propio reglamento parece ofrecer al problema, y está implementada como
criterio de interpretación —`aritmeticaImposible: 'blindajeProporcional'`—, disponible **solo en
desarrollo**. Ver [reglas.md](reglas.md#criterios-de-interpretación).

> **Artículo 27, numeral 1, punto V.** En los distritos en los que participen… deberán cumplir la
> paridad de género y medidas en favor de grupos vulnerables, **así como los criterios que se
> adoptan en estos Lineamientos en proporción al número de distritos que integre cada bloque**, y
> en lo que resulte aplicable.

Su objeto no son solo la paridad y las medidas: alcanza a «los criterios que se adoptan en estos
Lineamientos», y el 28.2 es uno de ellos. La lectura consiste en graduar **la prohibición**, que
es la que colisiona, en vez de dispensar la regla con la que colisiona.

Se ordenan las cuatro reglas por jerarquía. El piso del 23.1 y la mayoría del 28.4 y 28.5 no
ceden nunca. El blindaje del 28.2 se aplica con la mayor extensión que quepa —nunca más de las
dos posiciones que el artículo nombra— sin dejar al ámbito sin composición posible.

| n | Bloques | Prohibidas por la lectura literal | Prohibidas graduadas | Reparto mínimo |
|--:|---|---|---|---|
| 5 | 2-2-1 | 5 | **ninguna** | 1-1-1 |
| 7 | 3-2-2 | 6, 7 | **7** | 2-1-1 |
| 8 | 3-3-2 | 7, 8 | **8** | 1-2-1 |
| 11 | 4-4-3 | 10, 11 | **11** | 2-2-2 |

**Los otros once tamaños no se mueven.** No es un dial que afloje por comodidad: el conjunto de
tamaños donde se aparta de la lectura literal es idéntico al conjunto de tamaños que aquélla deja
sin salida, y está fijado como propiedad en `holgura.test.ts`. Tampoco puede cerrar una posición
que la lectura literal deje abierta: solo permite, nunca prohíbe.

### La comprobación que la sostiene

Con seis distritos el cálculo llega por su cuenta a **un** distrito cerrado. Que es, palabra por
palabra, lo que el artículo 28.7 manda para ese caso exacto.

`blindajeFactible` no sabe que ese artículo existe: parte del blindaje general de dos, comprueba
que con dos el ámbito se queda sin ninguna composición válida, y baja a uno. El único tamaño
parcial que el reglamento resuelve de su puño y letra es también el único donde se puede
contrastar el modelo, y coinciden.

Eso convierte la lectura en una generalización de la lógica que el propio redactor aplicó, y no
en una interpretación creativa. Sigue siendo una interpretación, y por eso vive tras
`import.meta.env.DEV` y no en `CRITERIOS_LEY`.

### Lo que puede objetarse

El 28.2 dice «en ningún caso», que es la fórmula más dura del documento, y el artículo 27 trata de
*integrar bloques*, no de graduar prohibiciones. Contra eso pesan las dos cosas de arriba —que el
punto V alcanza expresamente a «los criterios que se adoptan en estos Lineamientos», y que el 28.7
demuestra que el redactor sí escaló el blindaje por tamaño de bloque—, pero son una réplica, no
una certeza.

Y el caso n = 5 merece mirarse dos veces: ahí la prohibición no se reduce, se anula, y además el
único distrito del bloque bajo queda obligatoriamente para una mujer. Es literalmente el daño que
describe el artículo 21.1. Hay una salida más barata para ese caso concreto, que es la pregunta 1
de más abajo.

## Las preguntas que el reglamento no contesta

Cada una está redactada para que se pueda responder con un sí o un no, y cada una indica en qué
tamaños de tablero la respuesta cambia el resultado.

**1. ¿A qué se aplica la prohibición del 28.2 cuando el bloque bajo tiene menos de tres
distritos?** El 28.7 resuelve el caso 2-2-2 y nada más. Si un bloque bajo de un solo distrito
queda fuera de su alcance —no tiene «dos últimos distritos»—, el tamaño 5 se resuelve sin
necesidad de la lectura proporcional, y con un argumento más corto.
**Tamaños afectados:** n = 3, 4, 5, 7 y 8.

**2. En el 28.5, ¿«al menos uno de dichos bloques» son los bloques impares o los tres?** Si son
los impares, n = 5 y n = 11 son insatisfacibles por construcción. Si son los tres, la mayoría
puede recaer en un bloque que sí la admita.
**Tamaños afectados:** n = 1, 4, 5, 7, 10 y 11.

**3. ¿Cómo se reparte un bloque que no es de cinco?** El 26.3 dice «3 de un género y 2 del otro»
para bloques de cinco. El 27.1.V solo dice «en proporción… y en lo que resulte aplicable». El motor
usa como tope la mitad redondeada hacia arriba, **en los dos sentidos**: ni las mujeres ni los
hombres pueden superarlo.
**Tamaños afectados:** todos los menores de 13.

**4. ¿Cómo se redondea el 50% cuando el universo es impar?** El 23.1 pide «por lo menos 50% de
fórmulas del género femenino **y** 50% del masculino», que con universo impar es literalmente
insatisfacible. Con quince, el 26.3 y el 28.4 resuelven la ambigüedad sin necesidad de
interpretarla; con once, nueve o siete, no. El «entero siguiente» del 9.3 está acotado a los
porcentajes de coalición.

**5. ¿La cuota joven es proporcional o es una, siempre?** El 54.1 pide «cuando menos una fórmula»,
sin proporción. El 27.1.V dice que las medidas se cumplen «en proporción al número de distritos que
integre cada bloque, y en lo que resulte aplicable». El motor redondea la proporción, lo que
produce un escalón: **quien postula en siete distritos no debe ninguna fórmula joven; quien
postula en ocho debe una.** El artículo 54.2 tira en sentido contrario; ver
[pendientes-juridicos.md](pendientes-juridicos.md).
**Tamaños afectados:** todos los menores de 8.

**6. ¿Existe un mínimo de registro en mayoría relativa?** Nada de lo revisado en los Lineamientos
lo impide. El 75, numeral 1, fracción I fija once para tener derecho a representación
proporcional, pero no como requisito de registro. Habría que confirmarlo contra la Ley Local.

## Por qué conviene resolverlo antes del proceso

Los cuatro tamaños sin solución no son casos de laboratorio.

**Once** es el número que elegiría cualquier partido que quiera representación proporcional sin
postular de más, y es el tablero individual de cada socio de una coalición flexible en el mínimo.
**Siete y ocho** son lo que le queda a cada socio de una coalición parcial en el mínimo, según el
convenio abarque ocho distritos o siete.

Es decir: los tamaños que el reglamento no puede resolver son, precisamente, los que la propia
estructura de incentivos del artículo 9 y del 75.1 vuelve más probables.

## Qué haría con esto

Lo del 28.7 en n = 6 ya está corregido: había texto expreso y el motor lo contradecía.

Las seis preguntas las llevaría al área jurídica como están, junto con la tabla del 28.7 de la
sección anterior, que es el argumento más fuerte disponible y no depende de nadie. Las que se
resuelvan se vuelven código; las que queden abiertas se quedan como criterios con nombre en
[criterios.ts](../src/domain/reglas/criterios.ts), visibles solo en desarrollo, para que el
simulador pueda mostrar las dos lecturas sobre el mismo tablero en lugar de elegir una en
silencio.

Y no habilitaría el interruptor de apagar distritos en producción hasta que la 1, la 2 y la 5
tengan respuesta. Sin ellas, el simulador daría números que nadie podría defender.

## Registro de cambios

- **28.7 en el reparto 2-2-2.** `posicionesBlindadas(6)` pasó de `[5, 6]` a `[6]`. Con ello n = 6
  dejó de ser insatisfacible. Fijado con dos pruebas en `rentabilidad.test.ts`.
- **El ocho pasó de «exacto» a sin solución.** No cambió el motor, que siempre lo habría
  reportado: cambió la medición de este documento, que usaba un techo de capacidad femenina y no
  veía el tope del 26.3 en su otra dirección. La tabla maestra ya no usa techos.
- **El mínimo de RP se cita como artículo 75, numeral 1, fracción I.** Antes decía 74.1, que era
  una cita desplazada.
- **Lectura proporcional del punto V**, como tercer valor del criterio `aritmeticaImposible`.
  Resuelve los cuatro tamaños sin tocar los otros once, y reproduce el 28.7 sin tenerlo escrito.
  Dieciséis tamaños cubiertos en `holgura.test.ts`.
