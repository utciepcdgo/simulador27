# Reglas que evalúa el simulador

> **Este archivo se genera.** Sale de `src/domain/reglas/inventario.ts` y de
> `CRITERIOS_LEY`, y la suite de pruebas lo compara con el motor en cada corrida.
> No editarlo a mano: el cambio se pierde y la prueba falla. Para regenerarlo,
> `pnpm reglas:generar`.
>
> El [Technical Brief v2.0](technical-brief-v2.md) tiene una «Matriz de Reglas a
> Evaluar» que **ya no describe al motor**. Es un documento histórico. Este lo
> reemplaza.
>
> Lo que el motor todavía **no** resuelve, porque depende de una lectura que
> nadie ha fijado, está en [pendientes-juridicos.md](pendientes-juridicos.md).

El motor evalúa **15 reglas**: 9 obligatorias, 1 optativa y 5 condicionadas a un supuesto. Cada una devuelve si se cumple, un mensaje y el artículo que la sostiene. El dictamen de la interfaz y el documento en PDF imprimen exactamente eso.

## Cómo se lee un incumplimiento

No todo incumplimiento es igual, y la diferencia no es de gravedad sino de **vía**:

- **Por completar** — todavía falta colocar algo. Un tablero a medio llenar incumple casi todos
  los mínimos sin haber infringido nada.
- **Requiere sustitución** — lo que ya está puesto contradice la regla, y se repara reemplazando
  una fórmula.

Los dos son subsanables: el artículo 58, numeral 1, punto V prevé la etapa de requerimiento y
cumplimiento, y el 64 la desarrolla para la paridad y las medidas compensatorias, con plazo de
cuarenta y ocho horas.

## Sobre qué se evalúa

Las reglas no se aplican a «los quince distritos» sin más, sino a **ámbitos** que la norma manda
medir por separado y que **no se acumulan entre sí** (artículo 28.8):

- **Tablero** — un conjunto con bloques de competitividad propios: el del convenio, y el
  individual de cada partido que postula fuera de él. Cada uno renumera sus distritos desde 1 y
  los reparte de nuevo en tres bloques.
- **Registro consolidado** — todo lo que un partido postula, dentro y fuera del convenio. Es
  donde se mide su cincuenta por ciento.
- **Lista «A»** — las cinco posiciones de representación proporcional de cada partido.

## Medidas compensatorias: qué obliga y qué no

Es donde más se confunde, así que conviene el cuadro completo:

| Grupo | ¿Obliga? | Dónde | Artículo |
|---|---|---|---|
| Personas jóvenes | **Sí** | Al menos una fórmula de mayoría relativa | 54.1, 54.2 |
| Personas indígenas | **No** | Optativa en el Distrito XV y en cualquier otro | 56.1, 56.2 |
| Discapacidad, diversidad sexual, personas adultas mayores, migrantes | **Sí** | Al menos una en los tres primeros lugares de la Lista «A» | 55.1 |

Dos precisiones que cambian el resultado:

**La adscripción indígena no acredita la medida de la Lista «A».** El artículo enumera cuatro
grupos y no la incluye. Una fórmula indígena en la primera posición deja la medida sin cubrir.

**Una fórmula solo acredita cuando ambas integrantes pertenecen al mismo grupo** (artículo 5,
fracción XV), de modo que la sustitución no vacíe la medida. Cómo se acredita la pertenencia a
cada grupo lo desarrolla el artículo 57. La fórmula que combina grupos
distintos —propietaria indígena y suplente de la diversidad sexual, por ejemplo— conserva plena
validez y se registra con normalidad. Lo único que no hace es acreditar. Tratar eso como un
defecto de validez le quitaría a una persona indígena el derecho a elegir su suplencia, que es
justo lo contrario de lo que la acción afirmativa persigue.

## Los contrapesos

Varias reglas tiran en direcciones distintas, y ahí es donde el simulador gana su utilidad:

- **Paridad contra prohibición.** El artículo 23.1 pide al menos la mitad de fórmulas encabezadas
  por mujeres; el 28.2 cierra a las mujeres las posiciones de menor votación. El mínimo hay que
  alcanzarlo con las casillas que quedan.
- **Bloques contra paridad general.** El 26.3 topa cuántas mujeres caben en cada bloque, así que
  el mínimo global no se puede cubrir concentrándolas en uno solo.
- **Mayoría relativa contra Lista «A».** El encabezado compensatorio del 53.6 y 53.7 obliga a que
  la lista empiece por el género que quedó subrepresentado en los distritos. Cuanto más
  desequilibrada la mayoría relativa, menos margen deja en la representación proporcional.
- **Y hay tableros donde el sistema no cierra.** Con 5, 7, 8 u 11 distritos ninguna composición
  satisface a la vez las cuatro reglas. En el de 5 y el de 11, porque la mayoría femenina que el
  28.5 exige en el bloque bajo necesita justo las posiciones que el 28.2 cierra; en el de 7 y el
  de 8, porque el 28.2 cierra el bloque bajo entero y lo deja con más hombres de los que el 26.3
  admite. Está recorrido tamaño por tamaño en
  [tableros-parciales.md](tableros-parciales.md).

## Fórmula

### Homogeneidad de género de la fórmula

**Obligatoria.** Si la propietaria es mujer, la suplencia debe ser mujer. Si el propietario es hombre, la suplencia puede ser mujer o persona no binaria. Si es no binaria, la suplencia es libre.

**Se mide sobre:** Cada fórmula, al crearse o al modificarse.

> Es la única regla que se verifica antes de colocar nada. El rebote la cita.

<details><summary>Fundamento</summary>

Artículo 53.2 de los Lineamientos. Las fórmulas se integran por una persona propietaria y una suplente del mismo género; cuando la fórmula esté encabezada por una mujer, en ningún momento el suplente podrá ser un hombre o una persona no binaria. Cuando la persona propietaria es hombre, la suplencia puede ser ocupada por una mujer o por una persona no binaria (artículo 53.1), y si es no binaria, la suplencia es libre (artículo 53.3).

</details>

## Mayoría relativa

### Integración del convenio

**Condicionada.** Que no queden distritos sin decidir y que lo siglado alcance al menos el veinticinco por ciento, que es el mínimo de la coalición flexible.

**Se mide sobre:** Los quince distritos. Solo aplica a una alianza.

<details><summary>Fundamento</summary>

Artículo 9, numeral 1 de los Lineamientos. La coalición es total cuando abarca la totalidad de las candidaturas de mayoría relativa, parcial cuando abarca al menos el cincuenta por ciento y flexible cuando abarca al menos el veinticinco por ciento. Artículo 9, numeral 3: si el cálculo de ese porcentaje resulta en un número fraccionado, siempre se toma como cifra válida el número entero siguiente. En los distritos que el convenio no abarca, cada integrante realiza su postulación en lo individual y responde de ella con su propia competitividad.

</details>

### Integración del tablero

**Condicionada.** Que el ámbito tenga al menos un distrito que evaluar.

**Se mide sobre:** Cada tablero.

> Aparece cuando un tablero se queda sin distritos: sin ellos, ninguna otra regla puede decir nada de él.

<details><summary>Fundamento</summary>

Artículo 9, numeral 1 de los Lineamientos. La coalición es total cuando abarca la totalidad de las candidaturas de mayoría relativa, parcial cuando abarca al menos el cincuenta por ciento y flexible cuando abarca al menos el veinticinco por ciento. Artículo 9, numeral 3: si el cálculo de ese porcentaje resulta en un número fraccionado, siempre se toma como cifra válida el número entero siguiente. En los distritos que el convenio no abarca, cada integrante realiza su postulación en lo individual y responde de ella con su propia competitividad.

</details>

### Paridad general de MR

**Obligatoria.** Al menos el cincuenta por ciento de fórmulas encabezadas por mujeres.

**Se mide sobre:** El convenio de una alianza, y el registro consolidado de cada partido: lo que sigla más lo que postula por su cuenta.

<details><summary>Fundamento</summary>

Artículo 23, numeral 1 de los Lineamientos: se deberán postular candidaturas considerando por lo menos 50% de fórmulas del género femenino. Artículo 20, numeral 2, fracción I y II: en coalición total la paridad se verifica exclusivamente sobre el conjunto de la coalición y los partidos distribuyen los géneros libremente en los distritos que siglan; en coalición parcial o flexible el convenio debe ser paritario y, además, cada integrante garantiza su propia paridad global sumando lo que sigla más sus registros individuales. Artículo 20.3: la candidatura común exige las dos, la del convenio y la de cada partido.

</details>

### Paridad global del partido

**Condicionada.** Nada: es la exención. En coalición total la paridad se verifica exclusivamente sobre el conjunto, y los integrantes distribuyen los géneros libremente en lo que siglan.

**Se mide sobre:** Cada integrante de una coalición total.

> Aparece en el dictamen para explicar por qué a ese partido no se le mide, en vez de que su sección desaparezca sin más.

<details><summary>Fundamento</summary>

Artículo 23, numeral 1 de los Lineamientos: se deberán postular candidaturas considerando por lo menos 50% de fórmulas del género femenino. Artículo 20, numeral 2, fracción I y II: en coalición total la paridad se verifica exclusivamente sobre el conjunto de la coalición y los partidos distribuyen los géneros libremente en los distritos que siglan; en coalición parcial o flexible el convenio debe ser paritario y, además, cada integrante garantiza su propia paridad global sumando lo que sigla más sus registros individuales. Artículo 20.3: la candidatura común exige las dos, la del convenio y la de cada partido.

</details>

### Paridad del bloque (una por bloque)

**Obligatoria.** Que ningún género supere el tope del bloque. En bloques de cinco distritos eso es el reparto 3-2 o 2-3.

**Se mide sobre:** Cada uno de los tres bloques de competitividad del ámbito.

<details><summary>Fundamento</summary>

Artículo 26, numeral 3 de los Lineamientos: en cada bloque se deberán postular 3 fórmulas de candidaturas de un mismo género y 2 del otro. Artículo 28, numeral 3: en la postulación de diputaciones por el principio de mayoría relativa se deberá asegurar la integración paritaria en cada bloque. Artículo 22, numeral 1: los partidos no podrán postular menos mujeres de las que se establecen para cada bloque, aun cuando postulen más en cualquiera de los otros.

</details>

### Bloque encabezado por fórmula integrada por mujeres

**Condicionada.** Que al menos uno de los tres bloques esté encabezado por una fórmula integrada por mujeres, mirando el distrito de mayor porcentaje de votación de cada bloque.

**Se mide sobre:** Solo cuando los tres bloques se conforman con los quince distritos del Estado.

> Cruza los dos sentidos de «encabezar»: mira tres distritos concretos, no cuenta mujeres.

<details><summary>Fundamento</summary>

Artículo 28, numeral 1 de los Lineamientos. En el caso de que se conformen los tres bloques de competitividad con los quince distritos del Estado, al menos uno de ellos deberá ser encabezado por una fórmula integrada por mujeres, evaluando el distrito de mayor porcentaje de votación de cada bloque. > La regla está condicionada a ese supuesto y no alcanza a los bloques parciales.

</details>

### Mayoría de fórmulas encabezadas por mujeres en bloques impares

**Condicionada.** Con los tres bloques impares, que al menos dos tengan mayoría de fórmulas encabezadas por mujeres. Con uno o dos bloques impares, que al menos uno de ellos la tenga.

**Se mide sobre:** Los bloques de tamaño impar del ámbito.

> En tableros de 5 y 11 distritos choca con la prohibición del 28.2 y ningún acomodo satisface las dos. Ver el criterio «aritmeticaImposible».

<details><summary>Fundamento</summary>

Artículo 28, numeral 4 de los Lineamientos. En caso de conformar los tres bloques por un número impar de distritos cada uno, al menos dos de ellos deberán integrarse por mayoría de fórmulas encabezadas por mujeres. Artículo 28, numeral 5 de los Lineamientos: de los tres bloques que se conformen, en caso de que dos bloques o solo uno de ellos sean integrados por un número impar de distritos, al menos uno de dichos bloques deberá integrarse por mayoría de fórmulas encabezadas por mujeres.

</details>

### Prohibición en distritos de menor porcentaje de votación

**Obligatoria.** Que las posiciones de menor porcentaje de votación no lleven ninguna candidatura de mujer, ni como propietaria ni como suplente.

**Se mide sobre:** Los dos últimos distritos del bloque Baja, o el último cuando los bloques se integran con dos distritos cada uno.

> Que alcance a la suplencia es la lectura literal del «en ningún caso… candidaturas del género femenino». Ver el criterio «alcanceMenorVotacion».

<details><summary>Fundamento</summary>

Artículo 28, numeral 2 de los Lineamientos. En el tercer bloque de competitividad, en ningún caso se podrán postular candidaturas del género femenino en los dos últimos distritos de menor porcentaje de votación. Artículo 28, numeral 7: cuando los bloques se integren por dos distritos cada uno, la prohibición alcanza al último distrito del último bloque. Artículo 21, numeral 1: en ningún caso se admitirá postular candidaturas de forma exclusiva de mujeres en los distritos de menor votación, obligación que corresponde a cada partido en lo individual aun cuando compita en coalición o candidatura común.

</details>

### Medida compensatoria de personas jóvenes

**Obligatoria.** Al menos una fórmula en la que tanto la persona propietaria como la suplente cuenten hasta con treinta años cumplidos al día de la elección.

**Se mide sobre:** Toda la alianza dentro del convenio. En los distritos que cada partido postula en lo individual, en proporción y «en lo que resulte aplicable».

<details><summary>Fundamento</summary>

Artículo 54, numeral 1 de los Lineamientos. Los partidos políticos, coaliciones o candidaturas comunes deberán presentar cuando menos una fórmula de mayoría relativa en la que tanto la persona propietaria como la suplente cuenten hasta con treinta años cumplidos al día de la elección. Artículo 54, numeral 2: establece cuándo una fórmula postulada dentro del convenio satisface la obligación de todos sus integrantes, y qué ocurre si la alianza no la postula. Artículo 27, numeral 1, punto V: en los distritos que cada partido postula en lo individual, la medida se cumple en proporción al número de distritos que integre cada bloque, y en lo que resulte aplicable.

</details>

### Medida compensatoria de personas indígenas

**Optativa.** Nada. Los partidos «podrán» postular ahí una fórmula integrada por personas de origen étnico, y la de los demás distritos es «optativa más no limitativa».

**Se mide sobre:** El Distrito XV, y cualquier otro distrito.

> No puede incumplir. El Distrito XV **no es un espacio reservado**: admite cualquier fórmula, y no postular ahí la medida no es una falta. Impedir una postulación lícita sería el error más grave que esta herramienta puede cometer.

<details><summary>Fundamento</summary>

Artículo 56, numeral 1 de los Lineamientos: en el caso del distrito con mayor población indígena (Distrito XV), los partidos políticos **podrán** postular a una fórmula integrada por personas de origen étnico. Artículo 56, numeral 2: la postulación de fórmulas integradas por personas de origen étnico en distritos distintos al XV es igualmente optativa más no limitativa. No es un espacio reservado: el Distrito XV admite cualquier fórmula, y no postular ahí la medida no constituye incumplimiento.

</details>

## Representación proporcional

### Registro en once distritos para acceder a RP

**Obligatoria.** Registrar candidaturas de mayoría relativa en cuando menos once de los quince distritos.

**Se mide sobre:** Todo lo que el partido postula, siglado o no: postular no es siglar.

<details><summary>Fundamento</summary>

Artículo 75, numeral 1, fracción I: Los partidos políticos, coaliciones o candidaturas comunes deberán registrar candidaturas de mayoría relativa en cuando menos once de los distritos electorales uninominales en que se divide el Estado para tener derecho a la asignación de diputaciones de representación proporcional. Postular no es siglar: el partido que firma un convenio postula en todos los distritos que el convenio abarca, con independencia de a quién se siglen. El siglado sirve al reparto de votos, al financiamiento y a la integración de la Lista "B", no al alcance territorial de la postulación.

</details>

### Alternancia de género en RP

**Obligatoria.** Que los géneros se intercalen verticalmente, sin excepción.

**Se mide sobre:** Las cinco posiciones de la Lista «A» de cada partido.

<details><summary>Fundamento</summary>

Artículo 53, numeral 5 de los Lineamientos. La Lista "A" se integra de forma alternada entre ambos géneros, en orden de prelación y de manera sucesiva. Artículo 19.2: para efectos del cumplimiento de la regla de alternancia se considerará el género de la persona propietaria de la fórmula.

</details>

### Encabezado compensatorio de RP

**Obligatoria.** Que la primera posición corresponda al género subrepresentado en la mayoría relativa de ese partido. Con equivalencia exacta, el partido decide.

**Se mide sobre:** La Lista «A» de cada partido, contra su propio desempeño de mayoría relativa.

> Es el contrapeso: compensa en la lista lo que la mayoría relativa dejó desequilibrado.

<details><summary>Fundamento</summary>

Artículos 53, numerales 6 y 7 de los Lineamientos. Si más del cincuenta por ciento de las postulaciones de mayoría relativa corresponde a hombres, la primera candidatura de representación proporcional deberá ser para una mujer, la segunda para un hombre, y así sucesivamente; si más del cincuenta por ciento corresponde a mujeres, la primera deberá ser para un hombre. En caso de equivalencia exacta del cincuenta por ciento para cada género, el partido determina libremente el género que encabeza su Lista "A", debiendo alternar las siguientes posiciones, conforme al artículo 75, numeral 1, fracción II.

</details>

### Medida compensatoria en la Lista "A"

**Obligatoria.** Al menos una fórmula dentro de los tres primeros lugares que corresponda a personas con discapacidad permanente, de la diversidad sexual, adultas mayores o migrantes.

**Se mide sobre:** Las tres primeras posiciones de la Lista «A» de cada partido.

> La adscripción indígena **no** acredita esta medida: el artículo enumera cuatro grupos y no la incluye.

<details><summary>Fundamento</summary>

Artículo 55, numeral 1 de los Lineamientos. Los partidos políticos de manera individual deberán presentar al menos una fórmula dentro de los primeros tres lugares de su Lista "A" que corresponda a personas con discapacidad permanente, de la diversidad sexual, adultas mayores o migrantes, en la que tanto la persona propietaria como la suplente pertenezcan al mismo grupo. Artículo 57: formas de acreditación de cada grupo o sector social en desventaja.

</details>

## Criterios de interpretación

Donde el texto admite más de una lectura razonable, la elección es un dato con nombre y no una
decisión enterrada en una función. **En producción corre siempre la lectura de la ley**, marcada
abajo; la capa que permite cambiarlas existe solo en desarrollo, como herramienta de análisis.

### denominadorParidad

Artículo 20.2 de los Lineamientos.

| Lectura | Qué significa | ¿Es la de la ley? |
|---|---|---|
| `ambito` | Todos los distritos del ámbito, se hayan ocupado o no. | **Sí** |
| `registradas` | Solo las candidaturas efectivamente registradas. | No |

### aritmeticaImposible

Artículos 27.1.V, 28.2 y 28.5 de los Lineamientos.

| Lectura | Qué significa | ¿Es la de la ley? |
|---|---|---|
| `reportar` | Se reporta como incumplimiento aunque ningún acomodo lo resuelva. | **Sí** |
| `inaplicable` | Se tiene por no exigible, y el dictamen lo explica. | No |
| `blindajeProporcional` | Se gradúa la prohibición del 28.2 —la que colisiona— hasta donde el ámbito conserve solución. Nunca cierra más posiciones que la lectura literal. | No |

### alcanceMenorVotacion

Artículo 28.2 de los Lineamientos.

| Lectura | Qué significa | ¿Es la de la ley? |
|---|---|---|
| `candidatura` | Cualquier mujer de la fórmula, propietaria o suplente. | **Sí** |
| `propietaria` | Solo quien encabeza la fórmula. | No |
