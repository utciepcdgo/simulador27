import { CRITERIOS_LEY, type Criterios } from './criterios'
import { INVENTARIO_REGLAS, type Exigencia, type ReglaInventariada } from './inventario'

/**
 * Imprime `docs/reglas.md` a partir del inventario.
 *
 * El documento es una **vista** de los datos, no una copia: la prosa que no se
 * puede derivar del código vive aquí, y todo lo demás sale del inventario y de
 * `CRITERIOS_LEY`. `inventario.test.ts` lo compara con el archivo en cada
 * corrida, así que la suite falla si alguien cambia una regla y no el documento.
 *
 * Sin fecha ni nada que varíe entre ejecuciones: un documento que cambia solo
 * ensuciaría el historial y entrenaría a todo el mundo a ignorar su diferencia.
 */

const ROTULO_EXIGENCIA: Record<Exigencia, string> = {
  obligatoria: 'Obligatoria',
  optativa: 'Optativa',
  condicionada: 'Condicionada',
}

const ROTULO_AMBITO: Record<ReglaInventariada['ambito'], string> = {
  Token: 'Fórmula',
  MR: 'Mayoría relativa',
  RP: 'Representación proporcional',
}

const ORDEN: ReglaInventariada['ambito'][] = ['Token', 'MR', 'RP']

const LECTURAS: Record<keyof Criterios, { articulo: string; opciones: Record<string, string> }> = {
  denominadorParidad: {
    articulo: 'Artículo 20.2',
    opciones: {
      ambito: 'Todos los distritos del ámbito, se hayan ocupado o no.',
      registradas: 'Solo las candidaturas efectivamente registradas.',
    },
  },
  aritmeticaImposible: {
    articulo: 'Artículos 27.1.V, 28.2 y 28.5',
    opciones: {
      reportar: 'Se reporta como incumplimiento aunque ningún acomodo lo resuelva.',
      inaplicable: 'Se tiene por no exigible, y el dictamen lo explica.',
      blindajeProporcional:
        'Se gradúa la prohibición del 28.2 —la que colisiona— hasta donde el ámbito conserve solución. Nunca cierra más posiciones que la lectura literal.',
    },
  },
  alcanceMenorVotacion: {
    articulo: 'Artículo 28.2',
    opciones: {
      candidatura: 'Cualquier mujer de la fórmula, propietaria o suplente.',
      propietaria: 'Solo quien encabeza la fórmula.',
    },
  },
}

function ficha(regla: ReglaInventariada): string {
  const nombre = regla.porBloque ? `${regla.regla} (una por bloque)` : regla.regla
  const partes = [
    `### ${nombre}`,
    '',
    `**${ROTULO_EXIGENCIA[regla.exigencia]}.** ${regla.exige}`,
    '',
    `**Se mide sobre:** ${regla.universo}`,
  ]
  if (regla.nota) partes.push('', `> ${regla.nota}`)
  partes.push('', '<details><summary>Fundamento</summary>', '', regla.fundamento, '', '</details>')
  return partes.join('\n')
}

export function documentoDeReglas(): string {
  const porAmbito = ORDEN.map((ambito) => ({
    ambito,
    reglas: INVENTARIO_REGLAS.filter((r) => r.ambito === ambito),
  })).filter((g) => g.reglas.length > 0)

  const cuenta = INVENTARIO_REGLAS.length
  const obligatorias = INVENTARIO_REGLAS.filter((r) => r.exigencia === 'obligatoria').length
  const optativas = INVENTARIO_REGLAS.filter((r) => r.exigencia === 'optativa').length

  return `# Reglas que evalúa el simulador

> **Este archivo se genera.** Sale de \`src/domain/reglas/inventario.ts\` y de
> \`CRITERIOS_LEY\`, y la suite de pruebas lo compara con el motor en cada corrida.
> No editarlo a mano: el cambio se pierde y la prueba falla. Para regenerarlo,
> \`pnpm reglas:generar\`.
>
> El [Technical Brief v2.0](technical-brief-v2.md) tiene una «Matriz de Reglas a
> Evaluar» que **ya no describe al motor**. Es un documento histórico. Este lo
> reemplaza.
>
> Lo que el motor todavía **no** resuelve, porque depende de una lectura que
> nadie ha fijado, está en [pendientes-juridicos.md](pendientes-juridicos.md).

El motor evalúa **${cuenta} reglas**: ${obligatorias} obligatorias, ${optativas} optativa y ${cuenta - obligatorias - optativas} condicionadas a un supuesto. Cada una devuelve si se cumple, un mensaje y el artículo que la sostiene. El dictamen de la interfaz y el documento en PDF imprimen exactamente eso.

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

${porAmbito
  .map(
    ({ ambito, reglas }) =>
      `## ${ROTULO_AMBITO[ambito]}\n\n${reglas.map(ficha).join('\n\n')}`,
  )
  .join('\n\n')}

## Criterios de interpretación

Donde el texto admite más de una lectura razonable, la elección es un dato con nombre y no una
decisión enterrada en una función. **En producción corre siempre la lectura de la ley**, marcada
abajo; la capa que permite cambiarlas existe solo en desarrollo, como herramienta de análisis.

${(Object.keys(LECTURAS) as (keyof Criterios)[])
  .map((clave) => {
    const { articulo, opciones } = LECTURAS[clave]
    const filas = Object.entries(opciones)
      .map(
        ([valor, texto]) =>
          `| \`${valor}\` | ${texto} | ${CRITERIOS_LEY[clave] === valor ? '**Sí**' : 'No' } |`,
      )
      .join('\n')
    return `### ${clave}\n\n${articulo} de los Lineamientos.\n\n| Lectura | Qué significa | ¿Es la de la ley? |\n|---|---|---|\n${filas}`
  })
  .join('\n\n')}
`
}
