# Tableros parciales: qué exige cada regla y dónde el reglamento calla

Cuando un partido, coalición o candidatura común no postula en los quince distritos, el artículo
27 ordena rearmar los bloques con **los distritos donde sí se vaya a postular**. Este documento
recorre los quince tamaños posibles y contesta, para cada uno, tres preguntas:

- ¿Cuántas fórmulas encabezadas por mujeres **exige** el reglamento?
- ¿Cuántas **caben**, una vez aplicadas las prohibiciones y los topes por bloque?
- ¿Coinciden?

No es un ejercicio teórico. Un partido que quiera derecho a representación proporcional y nada
más registrará en **once** distritos, que es el mínimo del artículo 74.1. Y cada integrante de una
coalición flexible en el mínimo se queda con un tablero individual de once.

## Cómo se produjo

Las cifras salen de ejecutar el propio motor de reglas, no de aritmética a mano. Concretamente de
`tamanosDeBloque(n)` para el reparto del artículo 27, `posicionesBlindadas(n)` para el 28.2, el
tope `Math.ceil(tamaño / 2)` de `paridadBloques` y `minimoMujeres(n)` para el piso del 23.1.

Cualquiera puede reproducirlas llamando a esas cuatro funciones. Conviene fijarlas como prueba de
regresión: son el mapa completo del comportamiento del motor en tableros parciales.

## Tabla maestra

| n | Bloques (art. 27) | Prohibidas (28.2) | Regla de mayoría | Techo | Piso (50%) | ¿Cabe? | Cuota joven (27.4) |
|--:|---|---|---|--:|--:|---|--:|
| 1 | 1-0-0 | — | 28.5: Alta | 1 | 1 | exacto | 0 |
| 2 | 1-1-0 | — | 28.5: Alta o Media | 2 | 1 | sí | 0 |
| 3 | 1-1-1 | 3 | 28.4: dos bloques | 2 | 2 | exacto | 0 |
| 4 | 2-1-1 | 4 | 28.5: Media o Baja | 2 | 2 | exacto | 0 |
| **5** | 2-2-1 | 5 | 28.5: **solo Baja** | 2 | 3 | **CHOCA** | 0 |
| 6 | 2-2-2 | 6 | ninguna | 3 | 3 | exacto | 0 |
| **7** | 3-2-2 | 6, 7 | 28.5: Alta | 3 | 4 | **NO CABE** | 0 |
| 8 | 3-3-2 | 7, 8 | 28.5: Alta o Media | 4 | 4 | exacto | 1 |
| 9 | 3-3-3 | 8, 9 | 28.4: dos bloques | 5 | 5 | exacto | 1 |
| 10 | 4-3-3 | 9, 10 | 28.5: Media o Baja | 5 | 5 | exacto | 1 |
| **11** | 4-4-3 | 10, 11 | 28.5: **solo Baja** | 5 | 6 | **CHOCA** | 1 |
| 12 | 4-4-4 | 11, 12 | ninguna | 6 | 6 | exacto | 1 |
| 13 | 5-4-4 | 12, 13 | 28.5: Alta | 7 | 7 | exacto | 1 |
| 14 | 5-5-4 | 13, 14 | 28.5: Alta o Media | 8 | 7 | sí | 1 |
| 15 | 5-5-5 | 14, 15 | 28.4: dos bloques | 9 | 8 | sí | 1 |

**Techo** es cuántas fórmulas encabezadas por mujeres caben como máximo: por cada bloque, el menor
entre su tope de género y los distritos que la prohibición del 28.2 no cerró.
**CHOCA** significa que el bloque al que el 28.5 exige mayoría femenina no tiene distritos libres
suficientes para dársela. **NO CABE** significa que el techo queda por debajo del piso del 50%.

### Lo primero que salta

**Diez de los quince tamaños son «exacto»**: el número de fórmulas de mujeres queda enteramente
determinado, sin un solo grado de libertad en la cuenta. Solo en 2, 14 y 15 hay holgura. Un
tablero parcial no se «acomoda»: se resuelve o no se resuelve.

**Tres tamaños siguen sin solución**: 5, 7 y 11.

## Un defecto del motor, ya corregido

El caso **n = 6** no era una laguna del reglamento: era un error del simulador, y tenía texto
expreso en contra.

> **Artículo 28.7.** En el caso de que los bloques de competitividad se integren por **dos
> distritos en cada bloque**, en el último de éstos bloques no se deberá postular mujeres en **el
> último distrito** de menor porcentaje de votación.

Bloques de dos distritos cada uno es exactamente 2-2-2, es decir, n = 6. Y el artículo prohíbe
**un** distrito, no dos. El motor cerraba los dos —posiciones 5 y 6—, con lo que el bloque bajo
quedaba sin ningún lugar para mujeres: el ámbito admitía como máximo dos fórmulas encabezadas por
mujeres y el piso del cincuenta por ciento pide tres, así que ningún acomodo cumplía.

`posicionesBlindadas` ya devuelve `[6]` en el reparto 2-2-2, y n = 6 pasó a resolverse de forma
exacta con 3 de 6. La tabla de arriba refleja el comportamiento corregido.

## Qué resuelve la lectura alterna, y qué no

La otra pieza en juego es el bloque bajo de **un solo distrito** (n = 3, 4, 5). El 28.2 habla de
«los dos últimos distritos» y el 28.7 de bloques de dos. Ninguno contempla un bloque de uno, y el
motor decide cerrarlo entero.

Si se entiende que un bloque bajo de un solo distrito queda fuera del alcance del 28.2:

| n | Lectura actual | Lectura alterna |
|--:|---|---|
| 3 | exacto 2 | sí, 3 sobre un piso de 2 |
| 4 | exacto 2 | sí, 3 sobre un piso de 2 |
| **5** | **CHOCA** (techo 2, piso 3) | **exacto 3** |
| **7** | **NO CABE** (3 de 4) | **NO CABE** (3 de 4) |
| **11** | **CHOCA** (techo 5, piso 6) | **CHOCA** (techo 5, piso 6) |

Se resuelve el 5. **Siguen sin solución el 7 y el 11**, y por razones distintas:

**n = 7** (bloques 3-2-2). El bloque bajo tiene dos distritos y el 28.2 los cierra los dos —lo
dice literalmente—. Quedan tres lugares para mujeres y el piso pide cuatro. No hay lectura del
28.2 que lo salve sin contradecir sus palabras.

**n = 11** (bloques 4-4-3). El bloque bajo es el único impar, así que el 28.5 le exige mayoría:
dos de tres. El 28.2 cierra dos de sus tres distritos y deja uno. Además el techo, cinco, queda
bajo el piso de seis. **Es el tamaño del umbral de representación proporcional.**

## Las preguntas que el reglamento no contesta

Cada una está redactada para que se pueda responder con un sí o un no, y cada una indica en qué
tamaños de tablero la respuesta cambia el resultado.

**1. ¿A qué se aplica la prohibición del 28.2 cuando el bloque bajo tiene menos de tres
distritos?** El 28.7 resuelve el caso 2-2-2 y nada más.
**Tamaños afectados:** n = 3, 4, 5, 7 y 8.

**2. En el 28.5, ¿«al menos uno de dichos bloques» son los bloques impares o los tres?** Si son
los impares, n = 5 y n = 11 son insatisfacibles por construcción. Si son los tres, la mayoría
puede recaer en un bloque que sí la admita.
**Tamaños afectados:** n = 1, 4, 5, 7, 10 y 11.

**3. ¿Cómo se reparte un bloque que no es de cinco?** El 26.3 dice «3 de un género y 2 del otro»
para bloques de cinco. El 27.4 solo dice «en proporción… y en lo que resulte aplicable». El motor
usa como tope la mitad redondeada hacia arriba.
**Tamaños afectados:** todos los menores de 13.

**4. ¿Cómo se redondea el 50% cuando el universo es impar?** El 23.1 pide «por lo menos 50% de
fórmulas del género femenino **y** 50% del masculino», que con universo impar es literalmente
insatisfacible. Con quince, el 26.3 y el 28.4 resuelven la ambigüedad sin necesidad de
interpretarla; con once, nueve o siete, no. El «entero siguiente» del 9.3 está acotado a los
porcentajes de coalición.

**5. ¿La cuota joven es proporcional o es una, siempre?** El 53.1 pide «cuando menos una fórmula»,
sin proporción. El 27.4 dice que las medidas se cumplen «en proporción al número de distritos que
integre cada bloque, y en lo que resulte aplicable». El motor redondea la proporción, lo que
produce un escalón: **quien postula en siete distritos no debe ninguna fórmula joven; quien
postula en ocho debe una.**
**Tamaños afectados:** todos los menores de 8.

**6. ¿Existe un mínimo de registro en mayoría relativa?** Nada de lo revisado en los Lineamientos
lo impide. El 74.1 fija once para tener derecho a representación proporcional, pero no como
requisito de registro. Habría que confirmarlo contra la Ley Local.

## Por qué conviene resolverlo antes del proceso

Los tres tamaños sin solución no son casos de laboratorio.

**Once** es el número que elegiría cualquier partido que quiera representación proporcional sin
postular de más, y es el tablero individual de cada socio de una coalición flexible en el mínimo.
**Siete** es lo que le queda a cada socio de una coalición parcial en el mínimo, cuando el
convenio abarca ocho.

Es decir: los dos tamaños que el reglamento no puede resolver son, precisamente, los dos que la
propia estructura de incentivos del artículo 9 y del 74.1 vuelve más probables.

## Qué haría con esto

Lo del 28.7 en n = 6 ya está corregido: había texto expreso y el motor lo contradecía.

Las seis preguntas las llevaría al área jurídica como están. Las que se resuelvan se vuelven
código; las que queden abiertas se vuelven criterios con nombre en
[criterios.ts](../src/domain/reglas/criterios.ts), visibles solo en desarrollo, para que el
simulador pueda mostrar las dos lecturas sobre el mismo tablero en lugar de elegir una en
silencio.

Y no habilitaría el interruptor de apagar distritos en producción hasta que la 1, la 2 y la 5
tengan respuesta. Sin ellas, el simulador daría números que nadie podría defender.

## Registro de cambios

- **28.7 en el reparto 2-2-2.** `posicionesBlindadas(6)` pasó de `[5, 6]` a `[6]`. Con ello n = 6
  dejó de ser insatisfacible y quedó exacto en 3 de 6. Fijado con dos pruebas en
  `rentabilidad.test.ts`: una sobre las posiciones y otra sobre que el techo alcance el piso.
