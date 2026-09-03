# Simulador de Postulaciones Electorales

Simulador para validar jurídicamente la postulación de candidaturas del Proceso Electoral
Local 2026-2027 en Durango: 15 distritos de Mayoría Relativa y 5 posiciones de Representación
Proporcional.

El sistema **no captura nombres**. Trabaja con fórmulas anónimas definidas solo por atributos
jurídicos —género, edad, acción afirmativa— para evaluar paridad, bloques de competitividad y
cuotas de inclusión.

## Documentación

- [Technical Brief v2.0](docs/technical-brief-v2.md) — especificación funcional
- [Decisiones de interpretación jurídica](docs/decisiones.md) — los puntos que el brief dejaba
  abiertos, resueltos
- [CLAUDE.md](CLAUDE.md) — arquitectura y glosario

## Desarrollo

```bash
pnpm install
pnpm dev
```

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Servidor de desarrollo |
| `pnpm test` | Pruebas del motor de reglas |
| `pnpm build` | Verificación de tipos y compilación |
| `pnpm lint` | ESLint |
| `pnpm catalogo:generar` | Regenera `src/domain/catalogo/` desde el CSV |

## Estructura

```
data/                 CSV aprobados: registro de partidos y votación PEL 2023-2024
scripts/              Generador del catálogo
src/domain/           TypeScript puro: modelo, catálogo y motor de reglas (sin React)
src/store/            Zustand: estado del tablero y dictamen derivado
src/components/       Presentacional: las tres fases, la bandeja y el dictamen
src/components/ui/    shadcn (estilo base-vega, iconos Tabler) — generado por el CLI
```

Las dependencias van en un solo sentido: `domain → store → components`. El motor de reglas no
importa React, y es lo único cubierto por pruebas.

## Las tres fases

El simulador arranca sin postulante: primero se elige el modo —Individual, Coalición o
Candidatura Común— y los partidos que participan. Hasta entonces no hay tablero ni dictamen.
**No hay partido cargado por omisión, y es deliberado:** precargar uno sería una toma de postura.

1. **Convenio** — atribuye cada distrito al partido que lo sigla. Solo aparece en coalición o
   candidatura común.
2. **Mayoría relativa** — un tablero por ámbito, en pestañas separadas: el del convenio y, si la
   coalición es parcial o flexible, uno por integrante con los distritos que postula por su
   cuenta. Cada tablero tiene sus propios tres bloques de competitividad y **no se acumulan entre
   sí**, para que nadie compense con los distritos de la alianza el desequilibrio de género de los
   suyos.
3. **Lista "A"** — cinco posiciones de RP por partido.

En pantallas menores a 768 px el motor de arrastre se apaga y la asignación se hace con menús
desplegables, que ejecutan exactamente las mismas acciones del store.

Cuando una regla rechaza un movimiento, la fórmula vuelve a la bandeja y un diálogo cita el
fundamento (*efecto rebote*). Solo rebota lo irreparable: lo que todavía puede corregirse con
una asignación posterior aparece como pendiente en el dictamen, sin bloquear nada.

> **Aviso.** Las citas legales de `src/domain/reglas/fundamentos.ts` son marcadores
> `PENDIENTE`, no articulado vigente. Ver [decisiones](docs/decisiones.md#abierto).

## Stack

React 19 · TypeScript 6 · Vite 8 · Tailwind CSS v4 · shadcn/ui · Zustand · dnd-kit · Vitest
