# Cotejo del articulado contra el motor

Recorrido **inverso** de los Lineamientos: en vez de verificar que las citas del motor digan lo
que el documento dice —que es lo que hizo la revisión de septiembre de 2026—, aquí se recorre el
articulado preguntando por cada artículo si el motor lo evalúa.

La diferencia no es formal. Un cotejo de citas sólo puede validar lo que ya está citado, y no
encuentra un artículo que el motor **nunca citó**: no hay nada que verificar donde no hay cita.
Así se mantuvo durante meses la afirmación de que la candidatura común estaba permitida a los
partidos de nuevo registro, cuando el artículo 11.3 la prohíbe. El hueco no estaba en las citas,
estaba entre ellas.

**Fuente:** [Lineamientos PEL 2026-2027.md](Lineamientos%20PEL%202026-2027.md), 70 artículos.
**Fecha del cotejo:** 10 de noviembre de 2026.

---

## Lo que el motor evalúa, y con qué respaldo

Verificado artículo por artículo contra el texto. Ninguna de estas citas quedó desplazada.

| Artículo | Qué manda | Dónde vive |
|---|---|---|
| 5.XV, 5.XVI, 7.1, 7.2 | Homogeneidad de la fórmula y de la medida compensatoria | `homogeneidadGenero`, `accionAfirmativaAcreditada` |
| 9.1, 9.3 | Modalidades de coalición y redondeo al entero siguiente | `integracionDelConvenio` |
| 9.5, 11.3 | Nuevo registro: ni coalición ni candidatura común | `impedimentoDeConvenio` |
| 19.2 | La alternancia se mide por la persona propietaria | `alternanciaRP` |
| 20.2, 20.3 | Paridad en coalición total, parcial, flexible y común | `paridadGeneral`, `Ambito.paridadPropia` |
| 21.1 | Prohibición en distritos de menor votación, por partido | `blindajeBaja` |
| 22.1 | Los bloques son referente mínimo | `paridadBloques` |
| 23.1 | Al menos 50% de fórmulas de mujeres | `paridadGeneral` |
| 23.2, 29.2 | Los bloques no aplican a locales ni a nuevos registros | `aplicanBloques`, `exencionDeBloques` |
| 24.2, 25.2 | Los partidos sin historial no computan en el porcentaje | `porcentajesDe` ignora `null`, como `SUM` |
| 26.3 | Tres fórmulas de un género y dos del otro por bloque | `paridadBloques` |
| 27.1.I-III | Integración parcial: orden, tres bloques, excedente a los primeros | `tamanosDeBloque`, `integrarBloques` |
| 27.1.IV | Los distritos sin porcentaje previo van al final de la lista | `integrarBloques` ordena `null` al final |
| 27.1.V | Proporción de los criterios al tamaño del bloque | `minimoJovenes` |
| 28.1 | Un bloque encabezado por fórmula de mujeres, solo con los quince | `liderazgoBloque` |
| 28.2, 28.7 | Prohibición en los dos últimos, o en el último si los bloques son de dos | `posicionesBlindadas` |
| 28.3 | Integración paritaria en cada bloque | `paridadBloques` |
| 28.4, 28.5 | Mayoría femenina en bloques impares, según cuántos haya | `mayoriaBloqueImpar` |
| 28.8, 28.9 | Convenio e individuales se evalúan por separado | `ambitosDe`, tableros que no se acumulan |
| 29.1 | A los locales sí les aplican paridad y medidas | `evaluarMR` conserva paridad y cuotas sin bloques |
| 53.1-53.4 | Suplencias admisibles y lugar de las personas no binarias | `homogeneidadGenero`, `esMujer` |
| 53.5 | La Lista "A" alterna géneros | `alternanciaRP` |
| 53.6, 53.7 | Encabezado compensatorio según la mayoría de MR | `encabezadoCompensatorioRP` |
| 54.1, 54.2 | Una fórmula de personas jóvenes en MR, y a quién obliga | `cuotaJoven` |
| 55.1 | Una acción afirmativa en los tres primeros de la Lista "A" | `accionAfirmativaRP` |
| 56.1, 56.2 | La medida indígena es optativa, también en el Distrito XV | `cuotaIndigena` |
| 57.II.ii | Las personas no binarias acreditan diversidad sexual | `accionAfirmativaEfectiva` |
| 75.1.I | Once distritos para tener derecho a la asignación de RP | `accesoRP` |

Dos aciertos que conviene no perder, porque son fáciles de romper al tocar el código:

- **El artículo 55.1 enumera cuatro grupos** —discapacidad permanente, diversidad sexual, adulto
  mayor y migrante— y **no incluye a las personas indígenas ni a las jóvenes**. El motor acepta
  exactamente esos cuatro en la Lista "A".
- **El 27.1.IV** manda poner al final los distritos donde no se participó en 2023-2024. El motor
  ordena los `null` al final en lugar de tratarlos como cero, que los habría mandado al final
  igualmente pero afirmando una votación que no existió.

---

## Lo que la norma manda y el motor no evalúa

### 1 · Artículo 76.1 — la doble postulación no se puede representar

> **Artículo 76.1.** Los partidos políticos podrán registrar simultáneamente, en el mismo Proceso
> Electoral Local, hasta dos candidaturas a las diputaciones por los principios de mayoría
> relativa y por representación proporcional.

El simulador no lo permite, y no por una regla que lo impida: por cómo está modelado. Una fórmula
es un Token que ocupa un sitio, y colocarlo en la Lista "A" lo retira del distrito donde estuviera.
No hay forma de expresar «esta misma fórmula va en el Distrito IV y en la posición 2 de la Lista».

Es el único punto del cotejo donde **el motor es más restrictivo que la norma**, y el que más
trabajo costaría: admitir que un Token esté en dos ámbitos obliga a revisar el recuento —hoy
cuenta fórmulas, y una compartida se contaría dos veces—, el arrastre y la validación del límite
de dos.

**La pregunta.** ¿Entra la doble postulación en el alcance del simulador, o se deja fuera y se
dice en pantalla que no se modela?

### 2 · Artículo 75.1 — el acceso a RP tiene cuatro requisitos, no uno

El motor evalúa la fracción I y trata las otras tres por separado o no las trata:

| Fracción | Qué exige | Hoy |
|---|---|---|
| I | Registrar MR en cuando menos once distritos | `Derecho a la asignación de RP` |
| II | Registrar la Lista "A" con **cinco** fórmulas, con el encabezado compensatorio | Se evalúa como alternancia y encabezado, no como condición de acceso |
| III | Obtener cuando menos el **3% de la Votación Válida Emitida** | **No se menciona en ninguna parte** |
| IV | Garantizar la paridad de género en sus candidaturas | Se evalúa como paridad general, no como condición de acceso |

La fracción III es la única verdaderamente fuera de alcance: depende del resultado de la elección
y no de la postulación. Pero hoy el simulador no lo dice, y una herramienta que se llama «derecho
a la asignación de RP» y sólo mira once distritos puede leerse como si ese fuera el único
requisito.

**Lo que haría:** no evaluar la fracción III —no se puede— pero nombrarla donde se habla del
acceso, para que nadie concluya que con once distritos ya está.

---

## Fuera de alcance, verificado

No son huecos: son materias que el simulador no modela por diseño, y conviene dejar dicho que se
revisaron.

- **Artículos 30 a 51 y 58 a 74** — procedimiento de registro: SIRC, formatos, documentación
  comprobatoria, plazos, notificaciones, requerimientos y declaratoria de procedencia. El
  simulador no captura personas ni documentos.
- **Artículo 13 a 16** — elección consecutiva. Depende de quién ocupa el cargo, que es
  información de personas.
- **Artículo 67.1.II** — las sustituciones de candidaturas de mujeres se reemplazan por el mismo
  género. Es posterior al registro.
- **Artículos 77 a 81** — Lista "B", Lista Definitiva y asignación de diputaciones. Dependen del
  resultado de la elección.
- **Artículos 9.4 y 11.2** — uniformidad: prohibido integrar coaliciones o candidaturas comunes
  de forma diferenciada. En el simulador la alianza tiene un solo conjunto de integrantes, así que
  la uniformidad es estructural y no hay nada que verificar.

---

## Lo que sigue sin poder verificarse

**El ANEXO 1 no viene en el documento.** El artículo 26.1.I remite a él para los porcentajes de
rentabilidad de cada partido, que son la base de todo el ordenamiento de distritos:

> Los porcentajes de rentabilidad de cada partido político, se encuentran adjuntos a los presentes
> Lineamientos bajo el **ANEXO 1.**

El motor los toma de `data/sirc-bloques-diputaciones-PEL-2026-2027.csv`, que **no se ha cotejado
contra ese anexo**. Es exactamente la duda que abrió la observación 6 del área técnica: el orden
de distritos de su ejemplo no lo reproduce ningún partido ni ninguna de las 63 alianzas posibles
según el cálculo del simulador. Mientras el Anexo 1 no esté a mano, no se puede saber si la
diferencia está en los datos o en el ejemplo.

**Los dos reenvíos a legislación externa.** El 9.5 remite al artículo 85, numeral 4, de la Ley
General de Partidos Políticos; el 11.3 a «la legislación aplicable», sin precisarla. Ninguno se ha
contrastado contra su texto. Si alguno fuera más amplio que el artículo que lo invoca, la
implementación volvería a quedarse corta.
