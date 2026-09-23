# Simulador de Postulaciones Electorales — PEL 2026-2027, Durango

SPA para simular y validar jurídicamente la postulación de candidaturas: 15 distritos de
Mayoría Relativa y 5 posiciones de Representación Proporcional.

**Qué evalúa el motor, regla por regla:** [docs/reglas.md](docs/reglas.md). Se **genera** desde
`src/domain/reglas/inventario.ts` con `pnpm reglas:generar`, y la suite falla si se queda atrás;
no editarlo a mano. Las decisiones de interpretación están en
[docs/decisiones.md](docs/decisiones.md), y las que siguen abiertas en
[docs/pendientes-juridicos.md](docs/pendientes-juridicos.md).

[docs/technical-brief-v2.md](docs/technical-brief-v2.md) es el brief de origen y se conserva como
**documento histórico**: su matriz de reglas ya no describe al motor y en un punto afirma lo
contrario de la norma. No usarlo como especificación.

## Restricción absoluta

**El sistema nunca captura nombres de personas.** Trabaja con Tokens anónimos definidos solo
por atributos jurídicos (género, edad, acción afirmativa). Cualquier campo que permita
identificar a una persona real está fuera de alcance por diseño, no por omisión.

## Glosario (usar este vocabulario en el código, en español)

| Término | Significado |
|---|---|
| **Fórmula** | Par propietario + suplente. Es la unidad que se postula, nunca una persona sola. |
| **Token** | Una fórmula anónima, arrastrable en el tablero. |
| **Siglado** | El partido al que se atribuye un distrito dentro de un convenio de coalición. |
| **Fuera del convenio** | Distrito que la coalición no abarca: cada integrante lo postula por su cuenta, con su propia fórmula y su propia competitividad. |
| **Tablero** | Ámbito con ranking propio: el del convenio o el individual de un partido. No se acumulan entre sí. |
| **Registro** | Ámbito consolidado de un partido: todo lo que postula, dentro y fuera del convenio. Ahí se mide el 50%. |
| **Bloque** | Tercio de competitividad: Alta (posiciones 1-5), Media (6-10), Baja (11-15). |
| **Posición de rentabilidad** | Rank 1-15 del distrito según porcentaje de votación, por partido o coalición. |
| **Encabezar una fórmula** | Ser su propietario. Propiedad de la candidatura, no del territorio: es lo que miran la paridad general (20.2) y la mayoría en bloques impares (28.4 y 28.5). |
| **Cabeza de bloque** | El distrito de mayor votación de un bloque: posiciones 1, 6 y 11. Es territorio, y por sí sola no dice nada del género. Solo el artículo 28.1 cruza los dos sentidos, y por eso mira tres distritos en vez de contar mujeres. |
| **Blindaje** | Prohibición de postular fórmulas encabezadas por mujeres en las posiciones de menor votación del ámbito. Es vocabulario interno: en pantalla se lee «Prohibición en distritos de menor porcentaje de votación», por el artículo 28.2 de los Lineamientos. |
| **Efecto rebote** | El Token regresa a su origen cuando una regla lo rechaza, con AlertDialog citando la ley. |

## Arquitectura

El producto **es** el motor de reglas; la UI es su carcasa. De ahí el orden de dependencias,
que es unidireccional y no debe invertirse:

```
domain/  →  store/  →  components/
```

- `src/domain/` — TypeScript puro. Cero imports de React. Cada regla es una función
  `(estado) => ResultadoRegla` con `cumple`, `mensaje` y `fundamento_legal`. Es lo único que
  se prueba con Vitest, y se prueba antes de escribir la UI que lo consume.
- `src/store/` — Zustand. El resultado de validación es un **selector derivado**, nunca
  estado duplicado. `useCriterios()` es el único camino por el que un criterio de interpretación
  llega al motor, y fuera de desarrollo devuelve siempre `CRITERIOS_LEY`.
- `src/components/` — presentacional. `ui/` es shadcn (estilo `base-vega`, iconos Tabler); no
  editar a mano salvo para corregir un bug del componente.

## Criterios de interpretación

Donde el texto admite más de una lectura, la elección es un dato con nombre en
`src/domain/reglas/criterios.ts`, no una decisión enterrada en una función. Las reglas reciben
`Criterios` como segundo parámetro con `CRITERIOS_LEY` por omisión.

**En producción el simulador es un reflejo de la ley**: corre siempre con `CRITERIOS_LEY`. La
sección que permite cambiarlos vive tras `import.meta.env.DEV` y Vite la elimina del bundle. Ver
[docs/decisiones.md](docs/decisiones.md#criterios-de-interpretación).

Al añadir un criterio: nunca pasar una regla por punto libre a `map`/`flatMap` —el índice llegaría
como criterios— y cubrir las dos lecturas con pruebas.

## Datos

Dos CSV alimentan `src/domain/catalogo/`, que se **genera** con `pnpm catalogo:generar` y no se
edita a mano:

- `data/partidos-PEL-2026-2027.csv` — el registro vigente: 11 partidos con su orden de registro,
  siglas, nombre, **ámbito** (Nacional o Local) y si son **de nuevo registro**. El `id_partido`
  **es** ese orden y es la identidad del partido en el sistema. Los dos últimos campos deciden dos
  reglas —el artículo 9.5 cierra la coalición a los nacionales de nuevo registro, y el 23.2 exime
  de los bloques a esos y a los locales—, y se leen por
  [`elegibilidad.ts`](src/domain/reglas/elegibilidad.ts). **El archivo debe guardarse en UTF-8**:
  Excel lo pasa a ANSI si no se elige «CSV UTF-8», y el generador ya falla en voz alta si ocurre.
- `data/sirc-bloques-diputaciones-PEL-2026-2027.csv` — porcentaje de votación individual del PEL
  2023-2024, solo para los 6 partidos que compitieron.

Las dos fuentes se cruzan **por siglas, nunca por número**: el CSV de votación numera al PT como
3 y al PVEM como 4, y el registro los invierte. El generador avisa de la discrepancia.

Un partido de registro nuevo o local no tiene historial, y su porcentaje es **`null`, no cero**:
cero afirmaría que esa fue su votación válida emitida. Al sumar una alianza el `null` se ignora,
como `SUM`. Sin porcentaje no hay rentabilidad que ordenar, así que su tablero va en orden
ascendente de distrito y sin bloques. Ojo: «sin historial» y «local o de nuevo registro» no son lo
mismo, aunque hoy coincidan los mismos cinco partidos.

`bloque` no se almacena: se deriva de la posición de rentabilidad. Almacenar ambos garantiza
que algún día queden inconsistentes. Las siglas tampoco son llave: son etiqueta de presentación,
y todo rótulo pasa por `siglasDe(id)`.

## Comandos

```bash
pnpm dev          # servidor de desarrollo
pnpm test         # motor de reglas
pnpm build        # tsc -b && vite build
pnpm lint
```

TypeScript corre con `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly` y
`verbatimModuleSyntax`: los imports de solo tipo necesitan `import type`.
