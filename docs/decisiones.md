# Decisiones de interpretación jurídica

El [Technical Brief v2.0](technical-brief-v2.md) dejaba abiertos varios puntos que el motor de
reglas no puede resolver por sí solo. Estas son las respuestas acordadas, con la consecuencia
técnica de cada una.

## 1. Posición de rentabilidad

Se determina ordenando los 15 distritos de mayor a menor **porcentaje de votación del PEL
2023-2024**. Para un partido que compite individualmente, ese porcentaje lo aprueba el Consejo
General y se usa tal cual; para coaliciones y candidaturas comunes se calcula.

No se usa el total de votos absolutos. Importa porque cambia el orden de forma drástica: entre
7 y 12 de las 15 posiciones se mueven según cuál de las dos medidas se use, y los distritos
tienen padrones muy distintos (el D-III ronda 33 mil votos totales y el D-V, 59 mil).

## 2. Competitividad en coalición o candidatura común

Se **suman los porcentajes individuales** que cada partido integrante obtuvo en el PEL
2023-2024 en cada distrito, y con esas sumas se vuelve a ordenar los 15 distritos de mayor a
menor para generar la rentabilidad de la alianza.

El cuadro aprobado por el Consejo General distingue cinco escenarios según lo que cada partido
hizo en 2023-2024 (individual, coalición, coalición nueva, modificada o idéntica). Los cinco
resuelven a la misma operación: **siempre se parte del porcentaje individual de 2023-2024**. Lo
que cambia entre escenarios es únicamente el fundamento que hay que citar, no el cálculo. Por
eso `competitividad()` es una sola función y no cinco ramas.

| Participación PEL 2023-2024 | Participación PEL 2026-2027 | Regla |
|---|---|---|
| Individual | Coalición | Suma de porcentajes individuales de cada partido |
| Coalición | Individual | Solo el porcentaje individual del partido |
| Individual / Coalición | Coalición nueva (partidos distintos) | Suma de porcentajes individuales |
| Coalición | Coalición modificada (mismos partidos, distintos distritos) | Suma de porcentajes individuales |
| Coalición | Coalición idéntica (mismos partidos) | Suma de porcentajes individuales |

**Pendiente:** el CSV no registra qué partidos fueron coaligados en 2023-2024. Ese dato hace
falta solo para redactar el fundamento, no para calcular.

## 3. Género "No Binario"

Tres reglas distintas, y conviene no confundirlas:

- **Paridad:** las candidaturas no binarias se contabilizan obligatoriamente en los espacios
  del género masculino, por ser el sector que no ha sido discriminado históricamente
  (`generoParaParidad`). Consecuencia: no suman al mínimo de fórmulas encabezadas por mujeres,
  y sí pueden ocupar las posiciones 14 y 15 blindadas.
- **Homogeneidad de fórmula:** si la propietaria es Mujer, el suplente debe ser Mujer — un
  suplente No Binario se **rechaza**. Si la persona propietaria es No Binario, el suplente puede
  ser Hombre, Mujer o No Binario.
- **Acción afirmativa:** un perfil No Binario se reconoce **automáticamente** como del sector
  de diversidad sexual, sin declararlo (`accionAfirmativaEfectiva`).

## 4. Validez de la fórmula frente a acreditación de la cuota

Son dos preguntas distintas y el motor no debe confundirlas:

1. **¿Puede existir esta fórmula?** Solo lo decide el género: si la propietaria es mujer, la
   suplencia debe ser mujer. Nada más.
2. **¿Acredita alguna cuota?** Eso sí exige la fórmula completa: ambos integrantes del mismo
   grupo (discapacidad, diversidad sexual, adultos mayores, migrantes, indígena), o ambos de
   hasta 30 años para la cuota joven.

La homogeneidad de grupo condiciona **contar para la cuota**, no **poder postularse**. Una
fórmula con propietaria indígena y suplencia de la diversidad sexual —o suplencia sin
adscripción alguna— es una candidatura plenamente válida: compite con normalidad y el Instituto
la registra por la **vía ordinaria**. Lo único que pierde es la acreditación.

Tratarla como inválida sería el error más grave que puede cometer esta herramienta: le quitaría
a una persona indígena el derecho a elegir libremente su suplencia, que es exactamente lo
contrario de lo que la acción afirmativa persigue. El simulador debe reflejar el derecho, no
recortarlo.

Consecuencias en el código:

- `validarFormula` devuelve una sola regla, la de género. Se aplica al construir la fórmula.
- `accionAfirmativaAcreditada` y `esFormulaJoven` deciden la acreditación. No rechazan nada.
- La interfaz lo dice en voz alta: la ficha de una fórmula mixta lleva la etiqueta *vía
  ordinaria*, y el creador anticipa qué acreditará antes de agregarla. El silencio se leería
  como un error de la herramienta.

## 4-bis. El Distrito XV no es un espacio reservado

**Corregido.** El motor lo trataba como espacio reservado: rebotaba el arrastre de cualquier
fórmula que no acreditara la adscripción indígena y lo reportaba como incumplimiento. El
articulado no lo sostiene.

> **Artículo 56.1.** …en el caso del distrito con mayor población indígena (Distrito XV), los
> partidos políticos **podrán** postular a una fórmula integrada por personas de origen
> étnico.
>
> **Artículo 56.2.** La postulación de fórmulas integradas por personas de origen étnico en
> distritos distintos al XV será igualmente **optativa más no limitativa**…

«Procurarán» y «optativa» no fundan una prohibición. Impedir una postulación lícita es el error
más grave que puede cometer esta herramienta, y era exactamente el que estaba cometiendo.

Consecuencias en el código:

- `admiteEnDistrito` conserva **un solo** impedimento, la prohibición del artículo 28.2. No hay
  espacios reservados, así que tampoco hay dos reglas que citar fundidas.
- `cuotaIndigena` nunca incumple: informa si la medida se tomó y advierte, cuando procede, que
  ese distrito cae además en posición prohibida para fórmulas encabezadas por mujeres.
- El campo del catálogo pasó de `requiere_indigena` a **`mayoria_indigena`**. Nombra un hecho del
  distrito —los municipios de mayor porcentaje de población indígena, artículo 6.2— y no una
  obligación inexistente. El nombre viejo era la raíz del error.

## 4-ter. Grupos que acreditan la cuota de inclusión de RP

Solo cuatro: **discapacidad permanente, diversidad sexual, personas adultas mayores de sesenta
años y personas migrantes**. La adscripción indígena y la juventud quedan fuera porque la norma
las atiende territorialmente en mayoría relativa —el Distrito XV y una fórmula joven en cualquier
distrito— y no las enumera entre los grupos de RP.

Consecuencia práctica: una fórmula indígena en la posición 2 de la Lista "A" **no** acredita la
cuota de inclusión.

## 4-quater. Los dos sentidos de «encabezar»

La palabra aparece en tres artículos con dos sujetos distintos, y confundirlos cambia por
completo lo que el motor debe verificar.

| | Encabezar una **fórmula** | Encabezar un **bloque** |
|---|---|---|
| Qué significa | Ser la persona propietaria | Ocupar el distrito de mayor votación del bloque |
| De qué depende | De la integración de la candidatura | De la posición de rentabilidad: 1, 6 y 11 |
| Dónde se usa | Paridad general (20.2), blindaje, mayoría en bloques impares (28.4 y 28.5) | Liderazgo de bloque (28.1) |
| En el código | `esMujer(formula.propietario)` | `posicionesCabezaDeBloque` |

El artículo 28.1 es el único que **cruza** los dos: pide una fórmula encabezada por mujer *en la
cabeza* de al menos un bloque. Por eso no cuenta mujeres dentro del bloque —esa es la regla del
28.4— sino que mira exactamente tres distritos.

Los dos sentidos son independientes en las dos direcciones, y el motor lo demuestra con un
tablero de cada signo:

- `HMMMM HMMMM HMMHH` tiene **once** fórmulas encabezadas por mujeres, satisface el 28.4 en los
  bloques Alta y Media, y aun así **incumple** el 28.1: las tres cabezas son hombres.
- `HHHHH HHHHH MHHHH` tiene **una sola**, y lo **cumple**: está en la posición 11.

Ese es el sentido de la advertencia que el dictamen da en el caso de infracción —«basta cambiar
una»—: el remedio es mover una fórmula a una cabeza, no aumentar el número de mujeres.

## 5-bis. Quién responde por su propio cincuenta por ciento

**Corregido.** El motor exigía a cada integrante de una alianza la paridad de sus propios
siglados, siempre. El artículo 20 reparte esa carga de forma distinta según la figura, y en un
supuesto **releva expresamente** al partido:

| Figura | Convenio | Cada integrante |
|---|---|---|
| Partido solo | — | Sí, sobre sus quince (art. 23.1) |
| **Coalición total** | Sí | **No** (art. 20.2) |
| Coalición parcial o flexible | Sí | Sí, sobre su registro consolidado (art. 20.2) |
| Candidatura común | Sí | Sí (art. 20.3) |

> **Artículo 20.2, Coalición Total.** La paridad de género se verificará **exclusivamente** sobre
> el conjunto de las candidaturas postuladas por la coalición en su totalidad. Los partidos
> políticos asociados **podrán distribuir los géneros libremente** en los distritos que les
> corresponda siglar…

La corrección destapó una segunda omisión: **el convenio no medía su propio 50%**. `evaluarMR`
solo corría `paridadGeneral` sobre ámbitos consolidados, así que al eximir a los integrantes de
una coalición total nadie habría verificado el conjunto. Ahora el convenio de toda alianza lo
mide, que es lo que el 20.2 y el 20.3 exigen en las cuatro figuras.

`Ambito.paridadPropia` es el campo que lo decide, y su comentario lleva el reparto completo.
Al integrante exento se le emite `Paridad global del partido`, que cumple siempre y explica por
qué no se le mide: la regla es lo bastante contraintuitiva —el mismo partido, solo, sí cargaría
ocho de quince— como para que el silencio se leyera como una falla.

## 6. Coalición parcial y flexible

El convenio no tiene que abarcar los quince distritos. Los que quedan fuera **no** son distritos
sin decidir: son distritos donde **cada integrante compite por su cuenta**, con su propia fórmula
y su propia fuerza electoral. Según cuántos abarque, la coalición es Total, Parcial o Flexible.

Esto parte en tres lo que antes era una sola cosa.

### Integración parcial de bloques (Artículo 27)

Un ámbito parcial **no hereda** las posiciones del ranking de quince: se aísla, se reordena y se
reparte en tres bloques propios.

1. **Aislamiento.** Se toman solo los distritos del ámbito.
2. **Ordenamiento.** Se ordenan de mayor a menor por el porcentaje de quien los postula: el
   individual del partido para los que juega solo, la suma de la alianza para los del convenio.
3. **Renumeración.** Posiciones 1 a N, no las que ocupaban entre los quince.
4. **Reparto asimétrico.** Tres bloques forzosos; cuando N no es divisible entre tres, el
   excedente lo absorben los primeros. Siete distritos dan **3-2-2**; ocho, **3-3-2**; quince,
   5-5-5.

Con PRI-PAN y siete distritos fuera del convenio, el **Distrito X** queda en la **posición 1,
bloque Alta** para el PRI y en la **7, bloque Baja** para el PAN. No es una inconsistencia: son
dos competencias distintas sobre el mismo mapa.

De ahí que `DistritoActivo` guarde la competitividad de la alianza —la que sirve para negociar el
convenio— y que cada ámbito calcule la suya al proyectarse, en `DistritoEvaluado`.

**El convenio también se reintegra.** El artículo habla de los distritos que un partido juega
solo, pero un convenio de ocho distritos es igual de parcial, y dejarlo con las posiciones del
ranking de quince lo mediría con una vara que no le corresponde. Se aplica el mismo
procedimiento. **Conviene confirmarlo.**

### Consecuencias sobre las reglas de posición

Reintegrar los bloques mueve dos reglas que estaban ancladas a números fijos:

- **Blindaje.** Deja de ser «las posiciones 14 y 15» y pasa a ser «las dos de menor votación
  **del bloque Bajo** de este ámbito»: en un tablero de siete, la sexta y la séptima.

  Las dos mitades de esa frase importan y ninguna sobra. Que sea **relativa al ámbito** evita que
  el blindaje se evapore en los tableros parciales, que es donde más fácil resulta relegar a las
  mujeres. Que esté **dentro del bloque Bajo** evita el error contrario, que es peor: en un
  tablero de dos distritos el reparto es 1-1-0, y «las dos últimas del ámbito» serían las
  posiciones 1 y 2 —bloque Alto y Medio—, con lo que una regla escrita para impedir que se
  arrincone a las mujeres acabaría prohibiéndolas en la zona más rentable.

  Un test recorre los tamaños de 1 a 15 y comprueba que toda posición blindada cae en el bloque
  Bajo.

  **Excepción expresa del artículo 28.7.** Cuando los tres bloques se integran por dos distritos
  cada uno —el reparto 2-2-2, que solo ocurre con seis—, la prohibición alcanza únicamente al
  último distrito, no a los dos. El motor cerraba los dos, con lo que el bloque bajo quedaba sin
  ningún lugar para mujeres: el ámbito admitía a lo sumo dos fórmulas encabezadas por mujeres
  cuando el piso del cincuenta por ciento pide tres, y ningún acomodo cumplía. Corregido; ver
  [tableros-parciales.md](tableros-parciales.md).
- **Liderazgo de bloque (28.1).** La norma se condiciona a sí misma: exige que uno de los tres
  bloques lo encabece una mujer *«en el caso de que se conformen los tres bloques de
  competitividad con los quince distritos del Estado»*. En un tablero parcial no aplica. El motor
  la evalúa solo cuando `distritos.length === 15`.
- **Cabezas de bloque.** Dejan de ser 1, 6 y 11 y pasan a ser la primera posición de cada bloque
  según el reparto: en un tablero de siete, 1, 4 y 6. Solo las usa el 28.1, así que en la práctica
  siguen siendo 1, 6 y 11.
- **Mayoría femenina en bloques impares (28.4 y 28.5).** No están condicionadas al ámbito
  completo, así que corren en **todos** los tableros. En el de quince se acumulan con el 28.1: no
  se relevan, se suman.
- **Máximo por bloque.** El techo de tres por género era la mitad de cinco redondeada hacia
  arriba. Generalizado: `ceil(tamaño / 2)`. En un bloque de tres el máximo es 2; en uno de dos, 1.

### Tableros que no se acumulan

*Artículo 28, numeral 8 de los Lineamientos:* las candidaturas que un partido registra
individualmente **no son acumulables** a las de la coalición para la paridad transversal. Por eso
las reglas que dependen de dónde cae cada distrito —bloques, liderazgo, blindaje, cuota indígena—
se evalúan en tableros separados:

- uno para el convenio, con el ranking de la alianza;
- uno por cada integrante, con su ranking propio y solo sus distritos fuera del convenio.

### Postular no es siglar

De aquí salen dos universos distintos que conviene no confundir, porque el motor los usa para
cosas distintas:

| | Qué contiene | Para qué sirve |
|---|---|---|
| **Candidaturas propias** | Lo que el partido **sigló** + lo que postula por su cuenta | Paridad general y cuota joven (art. 20.2) |
| **Huella de participación** | **Todo** el convenio + lo que postula por su cuenta | Umbral de once distritos para RP (art. 75, numeral 1, fracción I) |

Firmar un convenio es postular en **todos** los distritos que abarca, con independencia de a
quién se siglen. El siglado tiene efectos precisos y acotados —reparto de votos, financiamiento y
de dónde se nutre la Lista "B" (art. 76.1)— pero **no acota el territorio en que el partido
postula**.

Medir el umbral sobre lo siglado era un defecto claro, no una interpretación discutible: con un
convenio de doce repartido seis y seis, ningún integrante podía pasar de nueve, así que la regla
quedaba insatisfacible y bloqueaba el dictamen para siempre. Con la huella, el PAN acredita doce
solo por el convenio, y quince si además postula en los tres huérfanos.

La regla se agrupa en el dictamen bajo la Lista "A" del partido, que es lo que habilita.

### La cuota joven es de la alianza; la de la Lista "A", de cada partido

El contraste entre dos artículos decide dónde vive cada cuota:

| | Sujeto obligado | Ámbito donde se evalúa |
|---|---|---|
| **Joven en MR** (art. 53.1) | «partidos políticos, **coaliciones** o candidaturas comunes» | El tablero |
| **Grupos en desventaja en Lista "A"** (art. 54) | «partidos políticos **de manera individual**» | La lista de cada partido |

Al enlistar a las coaliciones como sujetos capaces de cumplir, el 53.1 permite que **una sola
fórmula joven libere a todos los integrantes** dentro del convenio. Medirla sobre el consolidado
de cada partido —como hacía el motor— exigía dos fórmulas a una coalición de dos, que es obligar
a algo que la ley no pide.

El 54 dice lo contrario con todas sus letras, y por eso la cuota de inclusión de RP sigue
evaluándose lista por lista. Los dos artículos se leen juntos: si el legislador hubiera querido
lo mismo en ambos, no habría cambiado la enumeración del sujeto.

### La proporción del artículo 27, numeral 1, punto V

El convenio no cubre lo que cada partido postula por su cuenta. Ahí la medida vuelve, pero «en
proporción al número de distritos que integre cada bloque, y **en lo que resulte aplicable**».
Una fórmula por cada quince distritos, redondeada:

| Distritos fuera del convenio | 15 | 11 | 8 | 7 | 3 | 2 |
|---|---|---|---|---|---|---|
| Fórmulas jóvenes exigidas | 1 | 1 | 1 | 0 | 0 | 0 |

El umbral cae en **ocho**, más de la mitad. Por debajo la cuota es matemáticamente inaplicable, y
el dictamen lo dice con esas palabras —*«Cumplido por inaplicabilidad matemática»*— en vez de
guardar silencio.

Sin esta segunda mitad la regla se vaciaría: un partido metería cuatro distritos en un convenio
flexible con una fórmula joven y quedaría liberado de los once que postula solo. Con ella, esos
once le exigen la suya.

**El contraargumento, que conviene tener presente.** Cuando la ley aborda fracciones en otro
rubro —el artículo 9.3, para integrar coaliciones— manda tomar «siempre el número entero
siguiente», es decir un `ceil()`. Un revisor del Consejo General que trasladara ese criterio a las
cuotas de vulnerabilidad exigiría fórmula joven incluso en un tablero de un distrito. La frase «y
en lo que resulte aplicable» del 27.1.V es lo que sostiene el redondeo natural frente a esa lectura;
si el Consejo optara por el `ceil()`, el cambio es una línea en `minimoJovenes`.

**Asimetría deliberada.** El convenio exige una fórmula joven aunque abarque solo cuatro
distritos: el 53.1 no habla de proporción, y la proporcionalidad del 27.1.V está escrita para los
distritos que se postulan individualmente. **Conviene confirmarlo.**

### Registro unificado

*Artículo 20, numeral 2:* para el 50% de mujeres, cada partido responde por **todo lo que
registra**, dentro y fuera del convenio. Un partido que sigló 8 distritos y compite solo en 7
tiene un universo de 15 y debe llevar cuando menos 8 fórmulas encabezadas por mujeres.

Ese ámbito consolidado es también el que mira el encabezado compensatorio de la Lista "A" y la
cuota joven. El umbral de once distritos **no**: ese se mide sobre la huella de participación.

### Matriz de la paridad transversal

Los numerales 4 y 5 del artículo 28 son la misma regla con distinto cupo, y la cláusula *«o solo
uno de ellos»* del 5 cierra el hueco que dejaría una lectura literal del «dos bloques». Entre los
dos cubren cualquier reparto:

| Bloques impares | Numeral | Deben tener mayoría femenina |
|---|---|---|
| 3 | 28.4 | **dos** de ellos |
| 2 ó 1 | 28.5 | **uno** de ellos |
| 0 | — | ninguno |

Aplicado a los repartos que produce el artículo 27:

| n | Bloques | Impares | Exige |
|---|---|---|---|
| 15 | 5-5-5 | 3 | 2 bloques con 3 mujeres · **más el 28.1** |
| 13 | 5-4-4 | 1 | 3 mujeres en el bloque Alto |
| 11 | 4-4-3 | 1 | 2 mujeres en el bloque Bajo |
| 8 | 3-3-2 | 2 | 2 mujeres en el Alto o en el Medio |
| 7 | 3-2-2 | 1 | 2 mujeres en el bloque Alto |
| 6 | 2-2-2 | 0 | nada |
| 2 | 1-1-0 | 2 | 1 mujer en el Alto o en el Medio |

La mayoría de un bloque es más de la mitad, y coincide exactamente con el techo que impone
`paridadBloques`: un bloque impar con mayoría femenina está en su máximo permitido, así que las
dos reglas nunca se contradicen.

El único reparto sin exigencia transversal es el de seis distritos (2-2-2), donde no hay bloque
impar. No es un hueco del motor sino de la aritmética: la norma solo habla de bloques impares.

### El caso de los dos distritos huérfanos

Vale la pena seguirlo entero, porque es donde todas las piezas se tocan. Convenio de trece
distritos, dos fuera, y al PAN le tocó siglar siete:

| Ámbito | n | Bloques | Blindadas | Mínimo de mujeres |
|---|---|---|---|---|
| Convenio de coalición | 13 | 5-4-4 | 12 y 13 | 7 |
| PAN · fuera del convenio | 2 | 1-1-0 | ninguna | — |
| PAN · registro | 9 | — | — | 5 |

- El convenio de trece exige **7** porque el universo es impar y la mayoría corresponde al género
  femenino: `ceil(13/2)`.
- El registro del PAN suma sus siete siglados más los dos huérfanos: nueve, y `ceil(9/2)` da **5**.
- El tablero de dos huérfanos reparte 1-1-0. **El bloque Bajo queda vacío, así que el blindaje es
  matemáticamente inoperante** y el partido puede colocar mujeres en cualquiera de los dos, con
  plena libertad táctica. El dictamen lo dice con esas palabras en vez de callar.
- Los bloques Alto y Medio son impares —de uno cada uno—, así que corre el 28.5: uno de los dos
  debe tener mayoría femenina, y la mayoría de un bloque de uno es **una fórmula**. Con **una
  mujer y un hombre** el tablero queda en verde; da igual en cuál de los dos vaya ella. Postular
  mujeres en ambos solo es obligatorio si el registro consolidado lo necesita para llegar a su
  mínimo de 5.

Queda un caso degenerado: un ámbito de cero distritos no tiene cabezas de bloque ni bloques
impares, y las dos reglas se dan por satisfechas.

## Cambios al modelo del brief

1. **`AccionAfirmativa` incorpora `'Adulto Mayor'`.** El brief §4 no lo contemplaba y la
   definición de cuotas sí lo menciona como sector.
2. **`DistritoEstatico` se parte en dos.** `Distrito` es geografía (romano, cabecera,
   `requiere_indigena`), igual para todos los partidos; `Competitividad` es porcentaje, posición
   y bloque, que dependen de quién postula. El brief los tenía fusionados y `requiere_indigena`
   repetido en cada partido.
3. **`bloque` se deriva, no se almacena.** Es el tercio de la posición de rentabilidad.
   Guardar ambos garantiza que algún día se contradigan.

## Interacciones que el motor debe explicar, no solo bloquear

- **Distrito XV blindado.** Para **PAN y MC** el Distrito XV cae en la posición 14, donde las
  mujeres están blindadas y la fórmula indígena es obligatoria: la fórmula será Hombre/Hombre
  indígena forzosamente. No es contradicción legal, pero el diálogo debe citar las dos reglas, y
  eso hace `admiteEnDistrito`.
- **La paridad queda encajonada entre 8 y 9 mujeres.** Si en el bloque Baja las mujeres solo
  caben en las posiciones 11, 12 y 13, el techo de fórmulas encabezadas por mujeres en MR es 9 y
  el piso exigido es 8. Con 3 mujeres en el bloque Baja existe **una sola** configuración
  posible. El motor debe poder responder *por qué* no cabe una mujer en un lugar, no solo
  negarse.

## 5. Encabezado compensatorio de RP

El brief §6.C dice: *"Si MR Individual > 50% Hombres → Posición 1 de RP = Bloqueada para
Mujer"*. La frase admite dos lecturas opuestas —"reservada a una mujer" o "vedada a una
mujer"— y la segunda concentraría en el encabezado al género ya sobrerrepresentado, que es lo
contrario de lo que la regla se llama a sí misma. Se implementa la primera: **encabeza el
género subrepresentado en la MR de ese partido**.

Casos límite resueltos:

- **Equivalencia exacta.** Nadie está subrepresentado, así que el partido determina libremente
  el encabezado.
- **Cero distritos siglados.** Se resuelve por la misma vía: cero contra cero es equivalencia y
  el encabezado queda libre. Es la lectura más restrictiva posible del silencio de la norma —no
  se puede compensar una subrepresentación que no existe— y evita inventar una regla que no
  está escrita.
- **MR todavía abierta.** Mientras al partido le queden distritos por asignar, un encabezado
  que hoy contradice la compensación sigue siendo corregible por dos vías (mover la lista o
  mover la MR), así que es `pendiente` y **no dispara rebote**. Solo con la MR cerrada pasa a
  ser infracción.

## Criterios de interpretación

Hay bifurcaciones donde el texto admite más de una lectura razonable y el motor tiene que elegir
una para poder calcular. Hasta ahora cada elección vivía escondida dentro de una función, sin que
nadie pudiera verla ni discutirla. Ahora son un dato con nombre, con el artículo al lado y con
pruebas que corren las dos lecturas: `src/domain/reglas/criterios.ts`.

| Criterio | Artículo | Lectura de la ley | Lectura alterna |
|---|---|---|---|
| `denominadorParidad` | 20.2 | `ambito` — todos los distritos del ámbito | `registradas` — solo las candidaturas colocadas |
| `aritmeticaImposible` | 27.1.V, 28.2 y 28.5 | `reportar` — se reporta el incumplimiento | `inaplicable` — no resulta exigible |

**`CRITERIOS_LEY` es lo que corre en producción**, sin interruptor. La capa que permite cambiarlos
existe solo en desarrollo y tiene tres candados:

1. La sección del modal está tras `import.meta.env.DEV`, así que Vite la elimina del bundle: las
   cadenas «Criterios de interpretación» y «Solo en desarrollo» no aparecen en `dist`.
2. `useCriterios()` es el **único** camino por el que un criterio llega al motor, y fuera de
   desarrollo devuelve la ley sin mirar el estado guardado. Un `localStorage` copiado de una
   sesión de desarrollo no altera un dictamen de producción.
3. El `merge` del store descarta los criterios persistidos cuando no es desarrollo.

La insignia **«Criterio alterado»** del dictamen sí queda en el bundle de producción, y es
deliberado: es un fusible. Si algún cambio futuro dejara pasar un criterio distinto al de la ley,
el dictamen lo diría en su propia cara en vez de alterarse en silencio. Importa porque un
dictamen circula como captura de pantalla, sin la configuración que lo produjo al lado.

### Qué revela cada uno

**El denominador.** El artículo 20.2 dice «sumando las candidaturas… más sus registros». Leído al
pie de la letra, el universo son las candidaturas efectivamente colocadas, y el mínimo equivale a
exigir que las mujeres no sean menos que los hombres. El motor mide hoy sobre todos los distritos
del ámbito, que da un objetivo estable desde el primer movimiento pero infla el denominador de
quien decide no contender en algunos distritos fuera del convenio — nada le obliga a postular en
todos. **Creo que la lectura literal es la mejor y que el valor de origen debería cambiar**, pero
esa es una decisión jurídica y no la tomo yo.

**La aritmética imposible.** En ámbitos de **5 y 11 distritos** el bloque bajo queda impar y es el
único, así que el 28.5 le exige mayoría de fórmulas encabezadas por mujeres mientras el 28.2
cierra las posiciones que harían falta. Ningún acomodo lo resuelve. Los dos tamaños son
alcanzables: once es lo que le queda a cada socio de una coalición flexible en el mínimo, y es
además el umbral de registro para RP.

Bajo la lectura de la ley el motor lo reporta y añade que ningún acomodo lo satisface. Bajo la
alterna se apoya en el «y en lo que resulte aplicable» del 27.1.V y lo tiene por no exigible —pero
**lo dice**: la regla sigue en el dictamen con la explicación. Una regla que se esfuma callada es
peor que una que se contradice, porque la contradicción se ve y la ausencia no.

## Abierto

- La acción afirmativa de RP en posiciones 1-3 dice literalmente "un perfil" (brief §6.C). Se
  implementa como fórmula completa, por consistencia con la decisión 4, pero conviene confirmarlo.
- Las posiciones de la Lista "A" de RP se modelan como fórmulas (propietario + suplente); el
  brief no lo dice explícitamente.
- **Umbrales de la coalición parcial y flexible.** `MINIMO_PARCIAL` y `MINIMO_FLEXIBLE` usan el
  estándar federal —la mitad y la cuarta parte de los distritos: 8 y 4 de 15—. Faltan confirmar
  contra la LIPEED y los Lineamientos de Durango.
- **Lista "B".** El artículo 76.1 hace que el siglado determine de qué distritos se nutre la Lista
  "B" —los mejores perdedores— de cada partido. El simulador no la modela: solo cubre la Lista
  "A". Es la única consecuencia del siglado que hoy queda fuera del alcance.
- **Todos los `fundamento_legal` son marcadores.** `src/domain/reglas/fundamentos.ts` describe
  cada regla en prosa pero ninguna cita apunta a articulado vigente: falta sustituirlas por el
  artículo y numeral exactos de la LIPEED y del acuerdo del Consejo General. Auditoría:
  `grep -c PENDIENTE src/domain/reglas/fundamentos.ts`. Hasta entonces el simulador no debe
  usarse con efectos reales.
