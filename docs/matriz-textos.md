# Matriz de textos para revisión jurídica

Inventario literal de todo lo que la persona usuaria lee en tres cajas de la interfaz, para
adecuar la redacción a la LIPEED, a los Lineamientos para el Registro de Candidaturas del PEL
2026-2027 y a los acuerdos del Consejo General que apliquen.

**Alcance:** cajas `Dictamen`, `Balance de la postulación` y `Fórmulas disponibles`. No incluye
la Fase 1, la Fase 2, el modal de configuración ni las consideraciones de entrada.

## Estado de aplicación

**Aplicadas** todas las correcciones de la revisión jurídica: T-01 a T-04 y T-06; D-01, D-03,
D-05, D-06, D-09, D-10, D-17 a D-22, D-25, D-45, D-47, D-48, D-54, D-55, D-57, D-58, D-59, D-64,
D-68 a D-70; B-02, B-08 a B-11, B-14, B-15; F-04, F-06 a F-10, F-12, F-13, F-17, F-19, F-20,
F-22 a F-25.

**No aplicadas, y por qué:**

- **T-05 (plurales entre paréntesis).** La revisión conservó `distrito(s)` y `tiene(n)` en su
  propia redacción de D-39, D-40 y D-64, así que se entiende no aceptada. Los 17 casos siguen
  ahí. Se aplica en cuanto se confirme.
- **Filas sin corrección** (D-02, D-07, D-14, D-15, D-29 a D-38, D-41 a D-44, D-46, D-49 a D-53,
  D-56, D-60 a D-63, D-65 a D-67, B-01, B-03 a B-07, B-12, B-13, B-16, F-01 a F-03, F-05, F-11,
  F-14 a F-16, F-18, F-21, F-26). Se dejaron intactas: las propuestas de esta matriz no se
  aplican por sí solas.

**Cinco cambios que la revisión no pidió y se hicieron por consistencia:**

1. **D-46** llevaba `Las posiciones de rentabilidad 14 no llevan…` cuando el bloque Baja tiene
   un solo distrito. Se le puso rama singular. Es concordancia, no redacción.
2. **D-47 y D-57** dicen «los dos últimos distritos», y no siempre son dos: en ámbitos de tres,
   cuatro o cinco distritos el bloque Baja tiene uno solo. Se aplicó la redacción de la revisión
   con rama para ese caso: «está en el último distrito de menor porcentaje de votación».
3. **D-60 a D-63** expandían `MR` igual que D-64, que la revisión sí expandió. Se alinearon.
4. **F-05 y F-18** quedaban en `Suplente` frente a `Persona propietaria`. Se alinearon a
   `Persona suplente`, que es lo que F-17 supone.
5. **Fuera del alcance de las tres cajas**, pero con el mismo vocabulario retirado: el rótulo de
   la pestaña de la Fase 2 (`Individuales PAN` → `PAN en lo individual`), las dos etiquetas de la
   tarjeta de distrito (`Blindado` → `Menor votación`, `Cuota indígena` → `Personas indígenas`) y
   los dos mensajes de rechazo de `token.ts`, que comparten nombre de regla con el dictamen.

**Fundamentos legales.** Las citas de la revisión se trasladaron a
`src/domain/reglas/fundamentos.ts`: quedan resueltos `acreditacionCuota` (art. 5),
`paridadGeneral` (20.2), `liderazgoBloque` (28.1), `blindajeBaja` (28.2), `mayoriaBloqueImpar`
(28.4 y 186.6.b.ii LIPEED), `cuotaJoven` (186.6.c LIPEED y 27.1.V), `accionAfirmativaRP` (55.1 y 57) y,
parcialmente, `convenio` (24.1). **Siguen en `PENDIENTE` seis:** `homogeneidadGenero`,
`paridadBloques`, `cuotaIndigena`, `umbralRegistroRP`, `alternanciaRP` y
`encabezadoCompensatorioRP`, más los mínimos de coalición parcial y flexible.

**Tres puntos que conviene resolver antes de cerrar:**

- **D-55** perdió la mención del grupo: `requiere una fórmula con ambas personas pertenecientes a
  la misma medida compensatoria` ya no dice *cuál*. El nombre de la regla, justo encima en la
  pantalla, sí lo dice. Se aplicó literal; decir si se prefiere nombrarlo también en el mensaje.
- **D-15** quedó como `Paridad general de MR` dentro de una sección que ahora se llama
  `{SIGLAS} · paridad global`. No se contradicen, pero conviene decidir si se unifican.
- **Art. 28.5.** La revisión cita el 186.6.b.ii de la LIPEED para D-40, y en una sesión anterior
  se aportó el texto literal del 28.5 de los Lineamientos para el mismo supuesto. El fundamento
  quedó citando los dos.

## Cómo leer y llenar la matriz

| Columna | Qué contiene |
|---|---|
| **Id** | Llave estable para referirse a la cadena en la revisión. No cambia aunque cambie el texto. |
| **Texto actual** | La cadena tal como se emite. `{}` marca un valor que el motor sustituye en tiempo real. |
| **Observación** | Riesgo de redacción que ya se detectó. `—` significa que la cadena parece correcta. |
| **Redacción propuesta** | Propuesta a validar. `⚠` marca la que depende de confirmar el término exacto en la norma. |

**Nada de esta matriz inventa citas.** Donde hace falta el artículo exacto, se dice que hace
falta. Un fundamento falso en un dictamen de postulación es peor que uno ausente.

---

## 0. Decisiones transversales

Estas seis preceden a las tablas: cada una alcanza a decenas de cadenas, y resolverlas primero
evita revisar el mismo problema ochenta veces.

### T-01 · «Dictamen»

**Riesgo alto.** En la LIPEED y en los Lineamientos, *dictamen* nombra un acto formal de un
órgano electoral. Esta caja es una autoverificación en vivo que corre en el navegador de quien
la usa, sin efectos. La segunda consideración de entrada ya advierte que la herramienta no
sustituye la revisión oficial; el título de la caja la contradice.

Propuesta: **Verificación de requisitos** o **Revisión preliminar**. ⚠ Confirmar que el término
elegido no esté tomado en la norma para otro acto.

### T-02-bis · Rectificación: ningún incumplimiento es «no subsanable»

**Aplicado.** La primera versión de T-02 conservó dos niveles y llamó al severo
**No subsanable**. Eso reprodujo, con otro nombre, el error que ya traía el motor: asignaba el
nivel severo cuando **ya no quedaban distritos libres**, suponiendo que la única reparación
posible es *añadir*.

La vía real es **sustituir**, y no se agota al llenarse el tablero. El Instituto está obligado a
fijar plazo improrrogable para la sustitución, y solo si no se realiza procede al sorteo de
cancelación. Un tablero completo no cierra esa puerta.

Los dos niveles se conservan, pero ahora nombran **la vía de reparación** y no la gravedad:

| Valor en el código | Insignia | Cuándo |
|---|---|---|
| `por-completar` | **Por completar** | Faltan asignaciones; el requisito aún no está contradicho |
| `sustitucion` | **Requiere sustitución** | Lo colocado ya lo contradice: llenar huecos no basta |

Alcanza a las once reglas del dictamen. El valor `'infraccion'` ya no existe en el tipo, y el
comentario de `GravedadRegla` en `src/domain/types.ts` deja escrito por qué no puede volver.
Los selectores pasaron a llamarse `requierenSustitucion()` y `porCompletar()`.

### T-02 · «Infracción» y «Pendiente» *(superado por T-02-bis)*

**Riesgo alto.** *Infracción* pertenece al régimen sancionador. Una postulación que no alcanza
el mínimo de paridad no comete una infracción: produce un incumplimiento que da lugar a
requerimiento, a prevención para subsanar y, en su caso, a la negativa del registro.

El motor ya distingue exactamente lo que la norma distingue, solo que con otro nombre:

| Gravedad en el código | Qué significa hoy | Propuesta |
|---|---|---|
| `pendiente` | Todavía puede corregirse con los distritos o posiciones que quedan | **Subsanable** |
| `infraccion` | Ninguna asignación futura lo repara | **No subsanable** |

Ese par es vocabulario de la propia norma —la prevención se hace *para subsanar*— y describe
mejor lo que el motor calcula. Alcanza a las cadenas D-05, D-06 y a la descripción D-03.

### T-03 · «Cuota» → «acción afirmativa»

Los Lineamientos hablan de **acciones afirmativas**. *Cuota* es doctrinal. Alcanza a los nombres
de regla `Cuota de personas jóvenes`, `Cuota indígena`, `Cuota de inclusión en RP`, a la columna
del Balance y a seis cadenas de la caja de fórmulas.

### T-04 · Denominación de los grupos, en plural y con la persona primero

Las etiquetas actuales son adjetivos en singular, que es la forma que la normativa de acciones
afirmativas evita. Aplica a la caja `Fórmulas disponibles`, a la tabla del `Balance` y a las
fichas de cada fórmula.

| Actual | Propuesta | Nota |
|---|---|---|
| `Indígena` | Personas indígenas | |
| `Discapacidad` | Personas con discapacidad | ⚠ La norma puede exigir «discapacidad permanente» |
| `Diversidad Sexual` | Personas de la diversidad sexual | ⚠ Confirmar si la norma usa LGBTTTIQ+ |
| `Adulto Mayor` | Personas adultas mayores | El texto omite el umbral de sesenta años (ver F-14) |
| `Migrante` | Personas migrantes | |
| `Joven` | Personas jóvenes | El texto omite «al día de la elección» (ver F-13) |
| `No Binario` | No binario / personas no binarias | La norma escribe el término en minúsculas |

**Consecuencia técnica:** estas etiquetas hoy son la llave del tipo `AccionAfirmativa` en
`src/domain/types.ts`, y se imprimen tal cual. Cambiarlas obliga a elegir entre renombrar el tipo
—que arrastra el motor y las pruebas— o añadir una función `rotuloDe()` que traduzca la llave
corta al rótulo normativo solo al mostrarlo. **Se recomienda la segunda:** el dominio conserva
llaves estables y la redacción queda en un único lugar revisable.

### T-05 · Plurales entre paréntesis

Hay **17** cadenas con la forma `distrito(s)`, `infracción(es)`, `tiene(n)`. Un documento
institucional no se redacta así, y el motor ya tiene los números para resolverlo: `cuotaJoven` es
el único lugar donde se escribió la rama singular y plural de verdad.

Propuesta: rama real en las 17. Donde el valor puede ser cero, redactar también ese caso —«no
hay distritos por asignar» no es «0 distrito(s) por asignar»—.

### T-06 · «Blindaje», «Liderazgo», «Umbral», «Tablero», «Vía ordinaria»

Vocabulario interno del proyecto que se filtró a la pantalla. Cada uno tiene un equivalente
descriptivo que no pretende ser un término de arte:

| Actual | Propuesta |
|---|---|
| Blindaje de rentabilidad baja | Prohibición en distritos de menor rentabilidad ⚠ |
| Liderazgo de bloque | Bloque encabezado por fórmula de mujeres ⚠ |
| Umbral de registro para RP | Registro en once distritos para acceder a RP ⚠ |
| Vía ordinaria | Sin acción afirmativa ⚠ |
| Tablero (en `Integración del tablero`) | Ámbito de competitividad |

---

## 1. Caja «Dictamen»

### 1.1 Marco de la caja

`src/components/PanelDictamen.tsx`

| Id | Texto actual | Observación | Redacción propuesta |
|---|---|---|---|
| D-01 | `Dictamen` | Ver T-01 | Verificación de requisitos ⚠ |
| D-02 | `La postulación satisface todas las reglas evaluadas.` | «Reglas evaluadas» acota bien el alcance y conviene conservarlo | La postulación satisface todos los requisitos evaluados. |
| D-03 | `{n} infracción(es) · {n} pendiente(s)` | T-02 y T-05 | {n} no subsanables · {n} subsanables ⚠ |
| D-04 | `Cumple` | **Cadena muerta.** `estado()` la devuelve, pero la insignia solo se dibuja cuando la regla *no* cumple: nunca llega a pantalla | Eliminar la rama, o mostrarla |
| D-05 | `Infracción` | Ver T-02 | No subsanable ⚠ |
| D-06 | `Pendiente` | Ver T-02 | Subsanable ⚠ |

### 1.2 Encabezados de sección

Salen del campo `alcance` de cada regla. `src/domain/reglas/base.ts` y `convenio.ts`.

| Id | Texto actual | Observación | Redacción propuesta |
|---|---|---|---|
| D-07 | `{SIGLAS} · tablero` | T-06 | {SIGLAS} · ámbito de competitividad |
| D-08 | `{Modalidad} {SIGLAS-SIGLAS} · convenio` | — | — |
| D-09 | `{SIGLAS} · fuera del convenio` | Coincide con el glosario del proyecto; verificar que la norma nombre así a estos distritos | ⚠ |
| D-10 | `{SIGLAS} · candidaturas propias` | Ambiguo: son las candidaturas *atribuidas* al partido, dentro y fuera del convenio | {SIGLAS} · registro consolidado ⚠ |
| D-11 | `{SIGLAS} · Lista "A"` | — | — |
| D-12 | `{Modalidad} {SIGLAS-SIGLAS}` | — | — |

### 1.3 Nombres de regla

| Id | Texto actual | Observación | Redacción propuesta |
|---|---|---|---|
| D-13 | `Integración del convenio` | — | — |
| D-14 | `Integración del tablero` | T-06 | Integración del ámbito |
| D-15 | `Paridad general de MR` | Siglas sin desarrollar | Paridad general de mayoría relativa |
| D-16 | `Paridad del bloque {Alta\|Media\|Baja}` | — | — |
| D-17 | `Mayoría femenina en bloques impares` | ⚠ Confirmar si la norma dice «mayoría de fórmulas encabezadas por mujeres» | Mayoría de fórmulas encabezadas por mujeres en bloques impares |
| D-18 | `Liderazgo de bloque` | T-06 | Bloque encabezado por fórmula de mujeres ⚠ |
| D-19 | `Blindaje de rentabilidad baja` | T-06 | Prohibición en distritos de menor rentabilidad ⚠ |
| D-20 | `Cuota de personas jóvenes` | T-03 | Acción afirmativa de personas jóvenes ⚠ |
| D-21 | `Cuota indígena` | T-03 y T-04 | Acción afirmativa de personas indígenas ⚠ |
| D-22 | `Umbral de registro para RP` | T-06 | Registro en once distritos para acceder a RP ⚠ |
| D-23 | `Encabezado compensatorio de RP` | ⚠ Verificar si la norma nombra así esta regla | — |
| D-24 | `Alternancia de género en RP` | — | — |
| D-25 | `Cuota de inclusión en RP` | T-03 | Acción afirmativa en la Lista "A" ⚠ |

### 1.4 Mensajes

#### Integración del convenio — `convenio.ts`

| Id | Texto actual | Observación | Redacción propuesta |
|---|---|---|---|
| D-26 | `Faltan {n} distrito(s) por decidir: cada uno va siglado a un partido del convenio o queda fuera de él, para que cada integrante lo postule por su cuenta.` | T-05 | — |
| D-27 | `El convenio abarca {n} distrito(s); una coalición flexible requiere cuando menos {n}. Por debajo de ese mínimo no hay coalición que registrar.` | T-05. **El mínimo es supuesto:** `MINIMO_FLEXIBLE` usa el estándar federal de una cuarta parte, sin confirmar contra la LIPEED | ⚠ Confirmar el umbral antes de publicar este mensaje |
| D-28 | `Coalición {Total\|Parcial\|Flexible}: {n} distrito(s) en convenio y {n} fuera de él, que cada integrante postula por su cuenta.` | T-05. El mensaje dice «Coalición» aunque el postulante sea candidatura común | Usar la modalidad real del postulante |
| D-29 | `Este tablero todavía no tiene distritos asignados en el convenio.` | T-06 | Este ámbito todavía no tiene distritos asignados en el convenio. |

#### Paridad general de MR — `mr.ts`

| Id | Texto actual | Observación | Redacción propuesta |
|---|---|---|---|
| D-30 | `{n} de {n} fórmulas encabezadas por mujeres (mínimo {n}).` | — | — |
| D-31 | `Faltan {n} fórmulas encabezadas por mujeres para alcanzar el mínimo de {n}.` | T-05: falla con 1 | — |
| D-32 | `Ya es imposible alcanzar el mínimo de {n}: hay {n} fórmulas encabezadas por mujeres y solo {n} distritos sin asignar.` | «Ya es imposible» es correcto pero seco para un dictamen | El mínimo de {n} ya no es alcanzable: hay {n} fórmulas encabezadas por mujeres y {n} distritos sin asignar. |

#### Paridad de bloques — `mr.ts`

| Id | Texto actual | Observación | Redacción propuesta |
|---|---|---|---|
| D-33 | `Este ámbito no postula en ningún distrito del bloque {Bloque}.` | — | — |
| D-34 | `Bloque {Bloque}: {n} fórmulas encabezadas por mujeres y {n} por hombres, de {n} distrito(s).` | T-05 | — |
| D-35 | `El bloque {Bloque} ya tiene {n} fórmulas encabezadas por {mujeres\|hombres}; en un bloque de {n} el máximo por género es {n}.` | — | — |
| D-36 | `El bloque {Bloque} tiene {n} distrito(s) sin asignar.` | T-05 | — |

#### Mayoría femenina en bloques impares — `mr.ts`

| Id | Texto actual | Observación | Redacción propuesta |
|---|---|---|---|
| D-37 | `Ningún bloque de este ámbito tiene un número impar de distritos.` | — | — |
| D-38 | `{n} de los {n} bloque(s) impar(es) tiene(n) mayoría femenina: {Bloque} con {n}.` | T-05, tres veces en una sola línea | — |
| D-39 | `Los tres bloques son impares, así que dos deben integrarse por mayoría de fórmulas encabezadas por mujeres. Mayoría exigida: {…}. Hoy la tiene(n) {n}.` | T-05. La primera oración parafrasea el 28.4 y conviene alinearla literalmente | ⚠ |
| D-40 | `Hay {n} bloque(s) impar(es), así que uno debe integrarse por mayoría de fórmulas encabezadas por mujeres. Mayoría exigida: {…}. Hoy la tiene(n) {n}.` | Igual, respecto del 28.5 | ⚠ |

#### Liderazgo de bloque — `mr.ts`

| Id | Texto actual | Observación | Redacción propuesta |
|---|---|---|---|
| D-41 | `Este ámbito no postula en ninguna cabeza de bloque.` | «Cabeza de bloque» es vocabulario del proyecto | ⚠ Ver T-06 |
| D-42 | `La cabeza del bloque {Bloque} (distrito {N}) lleva fórmula encabezada por mujer.` | Igual | ⚠ |
| D-43 | `Ninguna cabeza de bloque lleva todavía fórmula encabezada por mujer; quedan {n} por asignar.` | Igual | ⚠ |
| D-44 | `Las tres cabezas de bloque —{…}— llevan fórmulas encabezadas por hombres. Basta cambiar una: no importa cuántas mujeres haya en el resto del bloque.` | La segunda oración es didáctica, no dictaminal. Es deliberada: evita que se confunda el 28.1 con el 28.4. Decidir si un dictamen puede orientar | Conservar como orientación, o mover a un pie |

#### Prohibición en distritos de menor rentabilidad — `mr.ts`

| Id | Texto actual | Observación | Redacción propuesta |
|---|---|---|---|
| D-45 | `El bloque Bajo de este ámbito está vacío, así que el blindaje es inoperante: admite fórmulas encabezadas por mujeres en cualquiera de sus posiciones.` | **Inconsistencia real:** dice `bloque Bajo`; el resto del sistema lo llama `bloque Baja`. Además, T-06 | Unificar a «bloque Baja» y sustituir «blindaje» ⚠ |
| D-46 | `Las posiciones de rentabilidad {n} y {n} no llevan fórmulas encabezadas por mujeres.` | — | — |
| D-47 | `Distrito {N}: está en posición de rentabilidad blindada y no admite fórmula encabezada por mujer.` | T-06 | Distrito {N}: está en una de las posiciones de menor rentabilidad y no admite fórmula encabezada por mujer. ⚠ |

#### Acción afirmativa de personas jóvenes — `mr.ts`

| Id | Texto actual | Observación | Redacción propuesta |
|---|---|---|---|
| D-48 | `Cumplido por inaplicabilidad matemática: {n} de 15 distritos no alcanzan la proporción de una fórmula joven.` | «Inaplicabilidad matemática» no es de la norma, pero describe con precisión el «en lo que resulte aplicable» del 27.1.V. Conviene citarlo | No aplicable: {n} de 15 distritos no alcanzan la proporción de una fórmula, conforme al artículo 27, numeral 1, punto V. ⚠ |
| D-49 | `{n} fórmula(s) integrada(s) por personas jóvenes (mínimo {n}).` | T-05 | — |
| D-50 | `Falta 1 fórmula integrada por personas jóvenes.` | Único lugar con rama singular escrita. Modelo para T-05 | — |
| D-51 | `Faltan {n} fórmulas integradas por personas jóvenes.` | — | — |
| D-52 | `Ya no se alcanza el mínimo de {n}: quedan {n} distrito(s) por asignar.` | T-05 | — |

#### Acción afirmativa de personas indígenas — `mr.ts`

| Id | Texto actual | Observación | Redacción propuesta |
|---|---|---|---|
| D-53 | `Ningún distrito de este ámbito requiere fórmula indígena.` | T-04 | …requiere fórmula integrada por personas indígenas. |
| D-54 | `Distrito {N}: fórmula indígena acreditada.` | T-04 | Distrito {N}: acción afirmativa de personas indígenas acreditada. ⚠ |
| D-55 | `Distrito {N}: requiere una fórmula con ambos integrantes indígenas.` | ⚠ Verificar si la norma exige la fórmula completa o solo la propiedad | — |
| D-56 | `Distrito {N}: falta asignar la fórmula indígena.` | T-04 | — |
| D-57 | ` Además está en posición de rentabilidad blindada, por lo que tampoco admite fórmula encabezada por mujer.` | T-06. Se concatena a D-55 y D-56 | ⚠ |

#### Registro en once distritos para acceder a RP — `mr.ts`

| Id | Texto actual | Observación | Redacción propuesta |
|---|---|---|---|
| D-58 | `{SIGLAS} postula en {n} distritos ({n} por convenio y {n} por su cuenta); el mínimo para RP es 11.` | La distinción postular/siglar que sostiene este cálculo no se explica aquí, y es contraintuitiva | Añadir: «Se cuentan todos los distritos que abarca el convenio, con independencia del siglado.» ⚠ |
| D-59 | `{SIGLAS} postula en {n} distritos ({n} por convenio); faltan {n} para el mínimo de 11.` | Igual | ⚠ |

#### Encabezado compensatorio de RP — `rp.ts`

| Id | Texto actual | Observación | Redacción propuesta |
|---|---|---|---|
| D-60 | `La posición 1 está vacía y debe encabezarla {una mujer\|un hombre}, por ser el género subrepresentado en la MR de {SIGLAS}.` | Siglas sin desarrollar | …en la mayoría relativa de {SIGLAS}. |
| D-61 | `La posición 1 está vacía. La MR de este partido está en equivalencia, así que la puede encabezar cualquier género.` | Igual | — |
| D-62 | `La MR de {SIGLAS} está en equivalencia entre géneros, por lo que el encabezado de la lista es de libre determinación.` | «Libre determinación» tiene otro sentido en materia indígena. Riesgo de colisión | …el partido determina libremente el género que la encabeza. |
| D-63 | `La lista la encabeza {una mujer\|un hombre}, género subrepresentado en la MR de {SIGLAS}.` | — | — |
| D-64 | `La lista la encabeza {una mujer\|un hombre}, pero el género subrepresentado en la MR de {SIGLAS} es {el femenino\|el masculino}. Todavía es corregible: quedan distritos de MR por asignar.` | «Todavía es corregible» ya expresa T-02 en prosa; alinear con «subsanable» | …Todavía es subsanable: quedan distritos de mayoría relativa por asignar. ⚠ |

#### Alternancia de género en RP — `rp.ts`

| Id | Texto actual | Observación | Redacción propuesta |
|---|---|---|---|
| D-65 | `La lista alterna correctamente a partir de una posición 1 encabezada por {mujer\|hombre}.` | — | — |
| D-66 | `La posición {n} rompe la alternancia: el resto de la lista exige que la posición 1 la encabece {una mujer\|un hombre}.` | — | — |
| D-67 | `Faltan {n} posición(es) por asignar: {n, n}.` | T-05 | — |

#### Acción afirmativa en la Lista "A" — `rp.ts`

| Id | Texto actual | Observación | Redacción propuesta |
|---|---|---|---|
| D-68 | `La posición {n} acredita un grupo en desventaja.` | «Grupo en desventaja» no es término normativo confirmado | ⚠ Ver T-04 |
| D-69 | `Ninguna de las tres primeras posiciones acredita todavía un grupo en desventaja; quedan {n} por asignar.` | Igual | ⚠ |
| D-70 | `Ninguna de las tres primeras posiciones acredita un grupo en desventaja (discapacidad, diversidad sexual, adulto mayor o migrante), y las tres ya están ocupadas.` | T-04 en la enumeración | …(personas con discapacidad, de la diversidad sexual, adultas mayores o migrantes)… ⚠ |

---

## 2. Caja «Balance de la postulación»

`src/components/PanelBalance.tsx` y `src/domain/reglas/recuento.ts`

| Id | Texto actual | Observación | Redacción propuesta |
|---|---|---|---|
| B-01 | `Balance de la postulación` | — | — |
| B-02 | `Una fórmula acredita una cuota solo cuando sus dos integrantes comparten el grupo. Las candidaturas se cuentan una por persona, acredite su fórmula o no.` | T-03 y T-04 | Una fórmula acredita una acción afirmativa solo cuando sus dos integrantes pertenecen al mismo grupo. Las candidaturas se cuentan una por persona, acredite su fórmula o no. ⚠ |
| B-03 | `Quién encabeza la fórmula` | — | — |
| B-04 | `{n} fórmulas · {n} candidaturas` | Falla con 1 | — |
| B-05 | `{n} de {n} encabezadas por mujeres · mínimo {n}` | Elide el sustantivo | {n} de {n} fórmulas encabezadas por mujeres · mínimo {n} |
| B-06 | `Sin distritos registrados` | «Registrados» sugiere un registro formal ante el Instituto; aquí solo significa que el partido no tiene distritos en su ámbito | Sin distritos en este ámbito |
| B-07 | `{SIGLAS}: {n} fórmulas encabezadas por mujeres, {n} por hombres, {n} sin asignar. Mínimo {n}.` | Etiqueta accesible de la tira. No se ve, sí se escucha | — |
| B-08 | `Entre las {n} candidaturas de mayoría relativa hay {n} mujeres, {n} hombres y {n} personas no binarias. Para la paridad, las candidaturas no binarias ocupan espacios del género masculino, así que solo aparecen en este renglón.` | La segunda oración enuncia una regla jurídica de fondo. Es la que más conviene alinear literalmente | ⚠ Confirmar contra el criterio aplicable del Consejo General |
| B-09 | `Grupos en desventaja` | Ver T-04 | ⚠ |
| B-10 | `Aún no hay fórmulas en el tablero. Al colocarlas aparecerá cuántas acreditan cada cuota y cuántas personas pertenecen al grupo sin que la fórmula lo acredite.` | T-03 y T-06 | Aún no hay fórmulas asignadas. Al colocarlas aparecerá cuántas acreditan cada acción afirmativa y cuántas personas pertenecen al grupo sin que su fórmula lo acredite. ⚠ |
| B-11 | `Grupo` | Encabezado de columna. Ver T-04 | ⚠ |
| B-12 | `Fórmulas` | Encabezado de columna | — |
| B-13 | `Candidaturas` | Encabezado de columna | — |
| B-14 | `Sin acreditar` | Término inventado, pero es la cifra central del panel: personas del grupo que ninguna fórmula acreditada respalda | ⚠ Definirlo en un pie, o renombrar |
| B-15 | `Joven` · `Indígena` · `Discapacidad` · `Diversidad Sexual` · `Adulto Mayor` · `Migrante` | Ver T-04 | ⚠ |
| B-16 | `Lista "A": {n} fórmulas · {n} candidaturas · {n} encabezadas por mujeres` | Falla con 1 | — |

---

## 3. Caja «Fórmulas disponibles»

`Bandeja.tsx`, `CreadorFormulas.tsx`, `FichaFormula.tsx`, `lib/formula.ts`

### 3.1 Marco

| Id | Texto actual | Observación | Redacción propuesta |
|---|---|---|---|
| F-01 | `Fórmulas disponibles` | — | — |
| F-02 | `Pares anónimos de atributos jurídicos. El sistema no captura nombres.` | Sostiene la restricción absoluta del proyecto y la primera consideración de entrada. «Sistema» es vago | Pares anónimos de atributos jurídicos. El simulador no captura nombres de personas. |
| F-03 | `Sin fórmulas disponibles` | Estado vacío mudo: no dice qué hacer | Sin fórmulas por asignar. Agrega una con el formulario de arriba. |

### 3.2 Constructor de fórmulas

| Id | Texto actual | Observación | Redacción propuesta |
|---|---|---|---|
| F-04 | `Propietaria` | **Riesgo real.** Rótulo del campo, fijo en femenino, aunque el perfil que se arma sea un hombre | Propietaria o propietario ⚠ |
| F-05 | `Suplente` | Neutro. Correcto | — |
| F-06 | `Mujer` · `Hombre` · `No Binario` | Ver T-04 sobre la mayúscula de «No Binario» | Mujer · Hombre · No binario ⚠ |
| F-07 | `Ninguna` | Opción de acción afirmativa | Sin acción afirmativa ⚠ |
| F-08 | `Indígena` · `Discapacidad` · `Diversidad Sexual` · `Adulto Mayor` · `Migrante` | Ver T-04 | ⚠ |
| F-09 | `Hasta 30 años` | **Riesgo real.** La norma dice «hasta treinta años cumplidos *al día de la elección*». La fecha de corte es materia de procedencia del registro y aquí se omite | Hasta 30 años cumplidos al día de la elección ⚠ |
| F-10 | `Suplencia idéntica a la propietaria` | Mismo problema que F-04 | Suplencia con los mismos atributos ⚠ |
| F-11 | `Acreditará: {grupos}` | T-03 | — |
| F-12 | `Vía ordinaria: la fórmula combina grupos distintos, así que es válida para competir pero no acredita cuota.` | T-03 y T-06. Enuncia la decisión 4 de `decisiones.md`, que es una interpretación y conviene sustentar | La fórmula combina grupos distintos: es válida y se registra sin acción afirmativa, pero no acredita ninguna. ⚠ |
| F-13 | `No acredita ninguna cuota.` | T-03 | No acredita ninguna acción afirmativa. ⚠ |
| F-14 | `Agregar fórmula` | — | — |

### 3.3 Etiquetas accesibles del constructor

No se ven; las lee el lector de pantalla. Se revisan porque son el texto que recibe quien no ve
la interfaz.

| Id | Texto actual | Observación | Redacción propuesta |
|---|---|---|---|
| F-15 | `Género de la persona propietaria` | — | — |
| F-16 | `Género de la persona suplente` | — | — |
| F-17 | `Acción afirmativa de la persona propietaria` | Usa ya el término correcto de T-03, a diferencia del texto visible | Modelo para el resto |
| F-18 | `Acción afirmativa de la persona suplente` | Igual | — |
| F-19 | `Persona propietaria de hasta 30 años` | Ver F-09 | …de hasta 30 años cumplidos al día de la elección ⚠ |
| F-20 | `Persona suplente de hasta 30 años` | Igual | ⚠ |

### 3.4 Ficha de cada fórmula

| Id | Texto actual | Observación | Redacción propuesta |
|---|---|---|---|
| F-21 | `M` · `H` · `NB` | Abreviaturas de género en la insignia. Se acompañan de la etiqueta accesible F-24 | — |
| F-22 | `vía ordinaria` | T-06 | Sin acción afirmativa ⚠ |
| F-23 | `Combina grupos distintos: candidatura válida que no acredita cuota.` | Tooltip de F-22. T-03 | Combina grupos distintos: candidatura válida que no acredita ninguna acción afirmativa. ⚠ |
| F-24 | `Fórmula {Género} propietaria, {Género} suplente, acredita {grupos}` | Etiqueta accesible. «Acredita» sin objeto explícito | …acredita la acción afirmativa de {grupos} ⚠ |
| F-25 | `Fórmula {Género} propietaria, {Género} suplente, vía ordinaria` | T-06 | …sin acción afirmativa ⚠ |
| F-26 | `Quitar {descripción de la fórmula}` | — | — |

---

## Anexo · Fundamentos legales

Fuera del alcance que se pidió, pero es la misma revisión: **los 15 fundamentos de
`src/domain/reglas/fundamentos.ts` son marcadores**, no articulado vigente. Todos empiezan con
`PENDIENTE: sustituir por la cita exacta.` y se muestran en el cuadro de rechazo cuando una
fórmula rebota.

Adecuar la redacción del `Dictamen` sin sustituir esas citas deja la mitad del trabajo hecha: el
dictamen diría bien lo que exige, y el rebote seguiría sin poder decir de dónde lo exige.

Auditoría rápida:

```bash
grep -c PENDIENTE src/domain/reglas/fundamentos.ts
```

Además, dos supuestos del motor que dependen de la misma revisión y están registrados en
[decisiones.md](decisiones.md#abierto):

- `MINIMO_PARCIAL` y `MINIMO_FLEXIBLE` en `convenio.ts` usan el estándar federal —mitad y cuarta
  parte— sin confirmar contra la LIPEED. Alimentan D-27 y D-28.
- El criterio de competitividad de un partido sin historial en el PEL 2023-2024 se resuelve hoy
  como 0% en los quince distritos, con desempate por número de distrito.
