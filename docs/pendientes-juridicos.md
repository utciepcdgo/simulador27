# Pendientes jurídicos

Preguntas abiertas que el simulador **no puede resolver por su cuenta**, porque dependen de cómo
deba leerse el articulado y no de cómo esté escrito el código.

Los cinco primeros salieron de verificar las catorce citas de
`src/domain/reglas/fundamentos.ts` contra el documento aprobado de los Lineamientos PEL
2026-2027, el 13 de septiembre de 2026. Esa revisión corrigió tres citas desplazadas —que ya están
arregladas— y destapó esos cinco puntos de fondo. El sexto es posterior y llegó por otro camino:
al medir qué tableros parciales admiten alguna composición válida.

Los cinco primeros van ordenados por riesgo. **El primero es el único donde el motor puede estar
dando hoy un dictamen equivocado a un partido real**; los demás son lecturas alternas que conviene
decidir antes del proceso, no errores confirmados. El sexto se numera al final para no mover los
que ya estaban, pero por consecuencia práctica iría segundo: afecta al tamaño de tablero más
probable de todos.

Cada punto tiene un hueco de respuesta al final. Lo que se conteste aquí se traslada al motor, y
donde la respuesta sea «admite las dos lecturas», el destino es
[`criterios.ts`](../src/domain/reglas/criterios.ts), no una decisión enterrada en una función.

---

## 1 · Los bloques de competitividad no aplican a todos los partidos

**Riesgo: alto.** Es el único punto en el que el motor puede estar evaluando mal a un partido
concreto en este momento.

**Lo que dice el documento**

> **Artículo 23.2.** Los bloques de competitividad no aplicarán a las candidaturas
> independientes, a los partidos políticos nacionales de nuevo registro con acreditación ante el
> Instituto, ni a los partidos políticos locales.

> **Artículo 29.2.** Los criterios establecidos para la integración de los bloques de
> competitividad (paridad transversal), no resultan aplicables a los partidos políticos locales,
> lo anterior, por tratarse del primer Proceso Electoral Local de diputaciones en que participan.

**Lo que hace el motor hoy**

Aplica los bloques a los once partidos por igual, y con ellos todo lo que cuelga de la geometría
del tablero: la paridad por bloque (26.3), la prohibición en distritos de menor votación (28.2),
el liderazgo de bloque (28.1) y la mayoría en bloques impares (28.4 y 28.5).

**Qué cambiaría**

A un partido excluido habría que evaluarle la paridad global y las medidas compensatorias, pero
**no** las cuatro reglas de bloque. Su tablero dejaría de tener bloques, y su dictamen pasaría de
unas diez reglas a unas cinco.

**Lo que necesito para implementarlo**

El registro (`data/partidos-PEL-2026-2027.csv`) solo trae orden, siglas y nombre. No distingue
nacional de local, ni de nuevo registro. Cinco partidos no tienen historial de votación en el
PEL 2023-2024, pero eso no basta: «sin historial» y «local o de nuevo registro» no son lo mismo.

| Partido | ¿Nacional o local? | ¿De nuevo registro? | ¿Se le aplican bloques? |
|---|---|---|---|
| PAN | N | | |
| PRI | N | | |
| PVEM | N | | |
| PT | N | | |
| MC | N | | |
| MORENA | N | | |
| PESD | L | | |
| PV | L | | |
| PER | L | | |
| PAZ | N | | |
| SOMOS | N | | |

**La pregunta.** ¿Cuáles de los once quedan fuera de los bloques de competitividad, y por cuál de
los dos supuestos del 23.2?

**Respuesta:**

---

## 2 · La Lista «A» podría exigir fórmulas del mismo género

**Riesgo: medio.** Afecta a qué fórmulas admite el simulador en la Fase 3.

**Lo que dice el documento**

> **Artículo 5, fracción XXI. Lista "A":** Relación de cinco fórmulas de candidaturas a
> diputaciones por el principio de representación proporcional **conformadas por una persona
> propietaria y suplente del mismo género**, listados en orden de prelación alternando fórmulas
> de género distinto de manera sucesiva…

Frente a la regla general de integración de fórmulas:

> **Artículo 53.1.** En la postulación de candidaturas, cuando la fórmula se encuentre encabezada
> por un hombre se podrá postular como suplente a una mujer o a una persona no binaria.

**Lo que hace el motor hoy**

Usa la misma regla de homogeneidad en los dos principios, así que una fórmula `H-M` es admisible
tanto en un distrito como en la Lista «A».

**Qué cambiaría**

Si manda la definición del 5.XXI, en la Lista «A» solo cabrían `M-M`, `H-H` y `NB-NB`. Las
fórmulas `H-M`, `H-NB` y `NB-M` seguirían siendo válidas en mayoría relativa e inválidas en
representación proporcional.

**La pregunta.** ¿La definición del 5.XXI restringe la composición de las fórmulas de la Lista
«A», o solo describe el caso ordinario sin desplazar la permisión del 53.1?

**Respuesta:**

---

## 3 · La homogeneidad de la medida: ¿obligación o condición de acreditación?

**Riesgo: medio.** Cambia si una fórmula mixta se rechaza o solo deja de acreditar.

**Lo que dice el documento**

> **Artículo 5, fracción XV. Fórmula:** …Asimismo, dicho principio será aplicable a las medidas
> compensatorias, por lo que, si la persona propietaria es postulada bajo alguna de estas
> categorías, la persona suplente **deberá pertenecer obligatoriamente** a esa misma medida.

> **Artículo 5, fracción XVI. Homogeneidad:** …Esta misma exigencia de uniformidad aplicará para
> las medidas compensatorias…; por lo tanto, si la persona propietaria es postulada bajo alguna
> de estas categorías, la persona suplente **deberá acreditar estrictamente** la misma condición
> o adscripción.

**Lo que hace el motor hoy**

Sigue lo decidido en [`decisiones.md` §4](decisiones.md): la fórmula que combina grupos distintos
—propietaria indígena y suplente de la diversidad sexual, por ejemplo— **es válida y se registra**;
lo único que no hace es acreditar la medida.

**Por qué esa lectura sigue en pie**

El artículo condiciona el deber a que la propietaria sea «postulada **bajo** alguna de estas
categorías». Si el partido no invoca la medida para esa fórmula, la propietaria no está postulada
bajo la categoría aunque pertenezca al grupo. Esa distinción es justo la que el simulador guarda
en el campo de adscripción declarada.

El argumento de fondo: tratarlo como requisito de validez le quitaría a una persona indígena el
derecho a elegir libremente su suplencia, que es lo contrario de lo que la acción afirmativa
persigue.

**Qué cambiaría**

Bajo la lectura estricta, el simulador tendría que **rechazar** la fórmula mixta en el momento de
crearla, con rebote, en vez de admitirla y anotar que no acredita.

**La pregunta.** ¿«Postulada bajo alguna de estas categorías» se refiere a que el partido invoque
la medida para esa fórmula, o a que la persona pertenezca al grupo con independencia de que se
invoque?

**Respuesta:**

---

## 4 · El artículo 54.2 es más categórico que la proporción del 27.1.V

**Riesgo: medio.** Afecta a cuándo se tiene por cumplida la medida de personas jóvenes.

**Lo que dice el documento**

> **Artículo 54.2.** Tratándose de coaliciones o candidaturas comunes, la obligación prevista en
> el numeral anterior se tendrá por cumplida para la totalidad de los partidos políticos
> integrantes si la fórmula de personas jóvenes es postulada dentro de los distritos que
> comprenda el convenio respectivo. **De no ser así, cada uno de los partidos políticos coaligados
> o en Candidatura Común, deberá cumplir con dicha postulación de manera individual en sus
> registros fuera del convenio.**

Frente a la regla de postulación parcial:

> **Artículo 27, numeral 1, punto V.** En los distritos en los que participen… deberán cumplir la
> paridad de género y medidas en favor de grupos vulnerables… **en proporción al número de
> distritos que integre cada bloque, y en lo que resulte aplicable**.

**Lo que hace el motor hoy**

En el tablero individual de cada partido aplica la proporción del 27.1.V, y tiene la medida por
inaplicable cuando el ámbito es tan pequeño que no alcanza para una fórmula.

**Qué cambiaría**

El 54.2 no admite esa graduación: si la fórmula joven no va dentro del convenio, **cada**
integrante debe postular una en lo suyo, tenga los distritos que tenga. Un partido con tres
distritos fuera del convenio pasaría de «no aplicable por proporción» a «obligado a colocar una
de tres».

**La pregunta.** ¿El 54.2 desplaza a la proporción del 27.1.V para esta medida en concreto, o el
«en lo que resulte aplicable» sigue graduándolo en tableros pequeños?

**Respuesta:**

---

## 5 · Los partidos nacionales de nuevo registro no pueden coaligarse

**Riesgo: bajo.** El simulador permite armar un convenio que la norma prohíbe.

**Lo que dice el documento**

> **Artículo 9.5.** Los partidos políticos nacionales de nuevo registro con acreditación ante el
> Instituto, no podrán suscribir convenio de coalición con otro partido político durante el
> Proceso Electoral Local 2026 – 2027, en términos de lo dispuesto por el artículo 85, numeral 4,
> de la Ley General de Partidos Políticos.

**Lo que hace el motor hoy**

Deja formar coalición con cualquier combinación de los once.

**Qué cambiaría**

La Fase 1 impediría incluir a esos partidos en una coalición, o lo advertiría. Ojo: la prohibición
es de **coalición**, no de candidatura común, y conviene no confundirlas al implementarlo.

Depende de la misma respuesta que el punto 1: saber qué partidos son de nuevo registro.

**La pregunta.** ¿Se refleja esta prohibición en el simulador, o se deja fuera por ser una
restricción del convenio y no de la postulación?

**Respuesta:**

---

## 6 · Cuatro tamaños de tablero no admiten ninguna composición válida

**Riesgo: alto por consecuencia, no por error.** El motor no se equivoca: reporta que las reglas
no se pueden cumplir todas, y es verdad. Lo que no puede hacer es decirle al partido qué mover,
porque no hay jugada que lo repare.

**Dónde ocurre**

Cuando un ámbito tiene 5, 7, 8 u 11 distritos. **Once es el tamaño más probable de todos**: es lo
que registra quien quiere derecho a representación proporcional sin postular de más, y es el
tablero individual de cada socio de una coalición flexible en el mínimo. Siete y ocho son lo que
le queda a cada socio de una coalición parcial en el mínimo.

El recorrido completo de los quince tamaños está en
[tableros-parciales.md](tableros-parciales.md).

**Lo que dice el documento**

> **Artículo 27, numeral 1, punto V.** En los distritos en los que participen… deberán cumplir la
> paridad de género y medidas en favor de grupos vulnerables, **así como los criterios que se
> adoptan en estos Lineamientos en proporción al número de distritos que integre cada bloque**, y
> en lo que resulte aplicable.

> **Artículo 28.2.** En el tercer bloque de competitividad (último bloque), **en ningún caso** se
> podrán postular candidaturas del género femenino en los dos últimos distritos de menor
> porcentaje de votación.

> **Artículo 28.7.** En el caso de que los bloques de competitividad se integren por dos distritos
> en cada bloque, en el último de éstos bloques no se deberá postular mujeres en **el último
> distrito** de menor porcentaje de votación.

**Lo que hace el motor hoy**

Aplica el 28.2 con su extensión completa y reporta el incumplimiento. Con `aritmeticaImposible:
'inaplicable'` puede además dispensar la regla del 28.5 que no se puede cumplir, diciéndolo.

**La lectura que se propone**

Graduar **la prohibición**, que es la que colisiona, en vez de dispensar la regla con la que
colisiona. El piso del 23.1 y la mayoría del 28.4 y 28.5 no ceden; el 28.2 se aplica con la mayor
extensión que quepa sin dejar al ámbito sin salida. Está implementada como tercer valor del
criterio —`blindajeProporcional`—, **solo en desarrollo**.

| n | Bloques | Prohibidas hoy | Graduadas | Reparto que se abre |
|--:|---|---|---|---|
| 5 | 2-2-1 | 5 | ninguna | 1-1-1 |
| 7 | 3-2-2 | 6, 7 | 7 | 2-1-1 |
| 8 | 3-3-2 | 7, 8 | 8 | 1-2-1 |
| 11 | 4-4-3 | 10, 11 | 11 | 2-2-2 |

Los otros once tamaños no se mueven, y en ninguno cierra una posición que la lectura literal deje
abierta.

**Lo que la sostiene**

Con seis distritos el cálculo llega por su cuenta a un solo distrito cerrado, que es lo que el
28.7 manda por escrito para ese caso exacto. El único tamaño parcial que el reglamento resuelve de
su puño y letra es también el único donde se puede contrastar el modelo, y coinciden. Eso la
vuelve una generalización de la lógica del propio redactor, no una interpretación creativa.

**Lo que puede objetarse**

«En ningún caso» es la fórmula más dura del documento, y el artículo 27 trata de *integrar
bloques*, no de graduar prohibiciones. Y en n = 5 la prohibición no se reduce: se anula, y el
único distrito del bloque bajo queda obligatoriamente para una mujer, que es el daño que describe
el artículo 21.1. Para ese caso concreto hay una salida más corta —que un bloque bajo de un solo
distrito no tiene «dos últimos distritos» y queda fuera del alcance del 28.2—, y no necesita nada
de esto.

**La pregunta.** ¿El «en proporción al número de distritos que integre cada bloque» del punto V
alcanza a la prohibición del 28.2, de modo que se gradúe con el tamaño del bloque bajo como ya lo
hace el 28.7? ¿O «en ningún caso» la blinda, y lo que cede es la regla de mayoría?

**Respuesta:**

---

## Fuera de alcance, anotado para que no se vuelva a preguntar

**Artículo 76.1 — registro simultáneo por ambos principios.** Permite registrar hasta dos
candidaturas a la vez por mayoría relativa y representación proporcional. El simulador **no puede
modelarlo**: trabaja con fórmulas anónimas y no sabe si dos fórmulas de dos listas son la misma
persona. Detectarlo exigiría capturar identidad, que está fuera de alcance por diseño.
