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

  Se rigen por el modelo de redacción de la interfaz, igual que el resto de la
  herramienta. Lo que más pesa aquí, por ser un recorrido guiado, son dos reglas:

  El texto describe lo que hace el sistema, en tercera persona del presente. No
  se le habla de tú a quien lee ni se le dan instrucciones. Un tutorial invita a
  escribir «arrastra la fórmula», y en esta interfaz eso es una conversación.
  Solo los botones llevan imperativo, porque nombran la acción que ejecutan.

  Se informa, no se conversa. Fuera las frases que empiezan por «cuando», «si» o
  «al» para anunciar una consecuencia: casi siempre sobran enteras. Un hecho por
  oración, y punto y seguido en vez de conectores.

  El vocabulario es el del glosario del proyecto y el de los Lineamientos:
  fórmula, siglado, tablero, bloque, posición de rentabilidad. Nunca «blindaje»,
  que es interno; en pantalla eso es la prohibición en distritos de menor
  porcentaje de votación.
*/

export const PASOS: readonly Paso[] = [
  {
    id: 'anonimato',
    titulo: 'El simulador no almacena nombres',
    cuerpo: (
      <>
        El simulador trabaja con <strong>fórmulas anónimas</strong>. Una fórmula se define por tres
        atributos jurídicos y nada más: género, edad y medida compensatoria. Ningún campo admite el
        nombre de una persona.
      </>
    ),
    Miniatura: Anonimato,
  },
  {
    id: 'formula',
    titulo: 'La fórmula es la unidad que se postula',
    cuerpo: (
      <>
        El simulador postula siempre una <strong>fórmula</strong>: el par de propietaria y suplente,
        nunca una persona sola. La fórmula acredita una medida compensatoria solo cuando{' '}
        <strong>ambas integrantes</strong> pertenecen al mismo grupo. La que combina grupos
        distintos conserva plena validez y se registra sin medida acreditada.
      </>
    ),
    Miniatura: LaFormula,
  },
  {
    id: 'fases',
    titulo: 'El trabajo avanza en tres fases',
    cuerpo: (
      <>
        Las fases corren de izquierda a derecha. El <strong>convenio</strong> define con quién se
        postula y a quién se sigla cada distrito. La <strong>mayoría relativa</strong> integra el
        tablero de los quince distritos. La <strong>Lista "A"</strong> reúne las cinco posiciones de
        representación proporcional. Las tres quedan abiertas en todo momento.
      </>
    ),
    Miniatura: Fases,
  },
  {
    id: 'arrastre',
    titulo: 'La fórmula se coloca arrastrándola',
    cuerpo: (
      <>
        Cada distrito recibe una fórmula, y el arrastre es la única manera de colocarla. La fórmula
        que una regla no admite <strong>vuelve a su origen</strong>, y el simulador cita el artículo
        que lo impide.
      </>
    ),
    Miniatura: Arrastre,
  },
  {
    id: 'no-postular',
    titulo: 'Un distrito puede quedar sin postulación',
    cuerpo: (
      <>
        El tablero admite retirar un distrito. Los{' '}
        <strong>bloques de competitividad se rehacen con los que quedan</strong>: se reordenan por
        porcentaje de votación y se reparten de nuevo en tres.
      </>
    ),
    Miniatura: NoPostular,
  },
  {
    id: 'configuracion',
    titulo: 'La configuración no toca el dictamen',
    cuerpo: (
      <>
        La configuración no cambia el dictamen. Cambia qué información se muestra junto al tablero y
        qué atajos aparecen en pantalla.
      </>
    ),
    Miniatura: Configuracion,
  },
  {
    id: 'balance',
    titulo: 'El balance cuenta las fórmulas de mujeres',
    cuerpo: (
      <>
        El balance mide una sola cosa: <strong>cuántas fórmulas encabezan mujeres</strong>. Cada
        celda es una candidatura, agrupadas por género. La marca señala el mínimo que exigen la ley
        y el reglamento.
      </>
    ),
    Miniatura: Balance,
  },
  {
    id: 'revision',
    titulo: 'La revisión preliminar corre sola',
    cuerpo: (
      <>
        La revisión se ejecuta en automático y dice, regla por regla, si ya se cumple. Lo que falta
        es de dos clases. <strong>Por completar</strong>: todavía no hay nada colocado.{' '}
        <strong>Requiere sustitución</strong>: hay que reemplazar una fórmula ya puesta.
      </>
    ),
    Miniatura: Revision,
  },
  {
    id: 'pdf',
    titulo: 'El documento reúne el resultado',
    cuerpo: (
      <>
        El documento reúne lo postulado, el tablero, las estadísticas y el dictamen con el
        fundamento de cada regla. Se emite <strong>solo con todas las reglas cumplidas</strong>.
      </>
    ),
    Miniatura: Descarga,
  },
]
