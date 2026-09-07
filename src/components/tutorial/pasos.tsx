import type { ReactNode } from 'react'
import {
  Anonimato,
  Arrastre,
  Balance,
  Configuracion,
  Descarga,
  Fases,
  LaFormula,
  NoPostular,
  Revision,
} from './miniaturas'

export interface Paso {
  id: string
  titulo: string
  /** Qué se explica. Va debajo de la muestra: primero se ve, después se lee. */
  cuerpo: ReactNode
  Miniatura: () => ReactNode
}

// ─── El recorrido ────────────────────────────────────────────────────────────

/*
  Sobre la redacción de estos textos.

  Oraciones cortas y afirmativas, sin incisos entre rayas. La frase que se
  interrumpe a sí misma para matizar suena a quien no se decide, y este producto
  emite dictámenes: la afirmación va primero y el matiz después, en punto y
  seguido. Donde algo depende del estado del tablero se dice cuándo —«todavía»,
  «mientras falte»—, que es una marca temporal y no una duda sobre el cálculo.

  El vocabulario es el del glosario del proyecto y el de los Lineamientos:
  fórmula, siglado, tablero, bloque, posición de rentabilidad. Nunca «blindaje»,
  que es interno; en pantalla eso es la prohibición en distritos de menor
  porcentaje de votación.
*/

export const PASOS: readonly Paso[] = [
  {
    id: 'anonimato',
    titulo: 'No almacenamos la información',
    cuerpo: (
      <>
        El simulador trabaja con <strong>fórmulas anónimas</strong>. Una fórmula son tres atributos
        jurídicos y nada más: género, edad y medida compensatoria. El sistema no captura ni almacena
        nombres de personas. No es una carencia, es una decisión de diseño.
      </>
    ),
    Miniatura: Anonimato,
  },
  {
    id: 'formula',
    titulo: 'Las fórmulas',
    cuerpo: (
      <>
        Nunca se postula a una sola persona, se postula una <strong>fórmula</strong>: el par de
        propietaria y suplente. Una fórmula acredita una medida compensatoria sólo cuando{' '}
        <strong>ambas integrantes</strong> pertenecen al mismo grupo. Si combinan grupos distintos,
        la candidatura es válida y se registra; lo único que no hace es acreditar la medida.
      </>
    ),
    Miniatura: LaFormula,
  },
  {
    id: 'fases',
    titulo: 'Tres fases...',
    cuerpo: (
      <>
        El trabajo avanza de izquierda a derecha. En el <strong>convenio</strong> decides con quién
        postulas y a quién se sigla cada distrito. En <strong>mayoría relativa</strong> integras el
        tablero de los quince. En la <strong>Lista "A"</strong>, las cinco posiciones de
        representación proporcional. Puedes volver atrás cuando quieras.
      </>
    ),
    Miniatura: Fases,
  },
  {
    id: 'arrastre',
    titulo: 'Arrastra la fórmula a su distrito',
    cuerpo: (
      <>
        Cada distrito recibe una fórmula, y se coloca arrastrándola. Si una regla no admite ese
        movimiento, la fórmula <strong>vuelve a su origen</strong> y el simulador cita el artículo
        que lo impide.
      </>
    ),
    Miniatura: Arrastre,
  },
  {
    id: 'no-postular',
    titulo: 'Puedes no postular en un distrito',
    cuerpo: (
      <>
        Al retirar un distrito, los{' '}
        <strong>bloques de competitividad se rehacen con los que quedan</strong>: se reordenan por
        porcentaje de votación y se reparten de nuevo en tres.
      </>
    ),
    Miniatura: NoPostular,
  },
  {
    id: 'configuracion',
    titulo: 'Ajusta la configuración',
    cuerpo: (
      <>
        La configuración no cambia el dictamen, cambia qué información acompaña al tablero y qué
        atajos tienes a la mano mientras trabajas.
      </>
    ),
    Miniatura: Configuracion,
  },
  {
    id: 'balance',
    titulo: 'El balance a la vista',
    cuerpo: (
      <>
        El balance responde una sola pregunta:{' '}
        <strong>cuántas fórmulas encabezan mujeres</strong>. Cada celda es una candidatura y van
        agrupadas por género. La marca señala el mínimo que exige la ley y reglamento: cuando las celdas de
        mujeres llegan hasta ella, la paridad está cubierta.
      </>
    ),
    Miniatura: Balance,
  },
  {
    id: 'revision',
    titulo: 'La revisión preliminar',
    cuerpo: (
      <>
        La revisión se ejecuta en automático mientras integras las postulacines e indica regla por regla si ya se
        cumple. Lo que falta es de dos clases: <strong>por completar</strong>, cuando aún no
        colocas algo, y <strong>requiere sustitución</strong>, cuando hay que reemplazar una
        fórmula ya puesta.
      </>
    ),
    Miniatura: Revision,
  },
  {
    id: 'pdf',
    titulo: 'Y al final, el documento',
    cuerpo: (
      <>
        El último paso es llevarte el resultado. El documento reúne lo postulado, el tablero, las
        estadísticas y el dictamen con el fundamento de cada regla. Se emite <strong>sólo cuando
        todas las reglas se cumplen</strong>; mientras falte algo, el botón no se habilita.
      </>
    ),
    Miniatura: Descarga,
  },
]
