import type { Transition, Variants } from 'motion/react'

/**
 * Vocabulario de movimiento de la herramienta.
 *
 * Dos duraciones y una curva, definidas una sola vez. Un simulador de
 * postulaciones no es una pieza expresiva: el movimiento está para explicar de
 * dónde salió algo o hacia dónde se fue, y en cuanto se nota como adorno estorba
 * a quien está negociando distritos.
 *
 * La curva arranca decidida y aterriza suave, que es lo que hace que un cambio
 * se sienta causado por el clic y no reproducido después de él.
 */
export const SUAVE: Transition = { duration: 0.24, ease: [0.2, 0, 0, 1] }
export const RAPIDO: Transition = { duration: 0.14, ease: [0.2, 0, 0, 1] }

/**
 * Aparición de una caja. El desplazamiento es de 8 px: suficiente para leer la
 * dirección, no tanto como para que la página parezca acomodarse sola.
 */
export const aparicion: Variants = {
  oculto: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: SUAVE },
  saliente: { opacity: 0, y: -4, transition: RAPIDO },
}

/**
 * Contenedor que escalona a sus hijos.
 *
 * No anima nada por sí mismo —de ahí los estados vacíos—: solo reparte el turno,
 * para que las columnas entren en el orden en que se leen y no las tres a la vez.
 */
export const contenedor: Variants = {
  oculto: {},
  visible: { transition: { staggerChildren: 0.06 } },
  saliente: {},
}

/**
 * Cambio de paso, con dirección.
 *
 * El desplazamiento lo decide `custom`: +1 al avanzar, -1 al retroceder. Las
 * tres fases son una secuencia —convenio, mayoría relativa, Lista "A"—, así que
 * el sentido del movimiento dice algo cierto sobre dónde quedó uno parado. Son
 * 20 px, un empujón y no un carrusel: a las pestañas también se llega saltando.
 */
export const paso: Variants = {
  entra: (direccion: number) => ({ opacity: 0, x: direccion * 20 }),
  centro: { opacity: 1, x: 0, transition: SUAVE },
}

/** Fichas que entran y salen de una lista: la bandeja de fórmulas. */
export const ficha: Variants = {
  oculto: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: RAPIDO },
  saliente: { opacity: 0, scale: 0.96, transition: RAPIDO },
}

/**
 * Relevo entre dos contenidos que ocupan el mismo lugar: el estado vacío y la
 * tabla, o el icono de una regla que cambia de dictamen.
 */
export const relevo: Variants = {
  oculto: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: RAPIDO },
  saliente: { opacity: 0, scale: 0.9, transition: RAPIDO },
}

/**
 * Contenido que se revela en su sitio y empuja lo que tiene debajo.
 *
 * A diferencia de `aparicion`, anima el alto: se usa donde el contenedor crece
 * —un popover que despliega un campo más, o que suma el motivo de un rechazo—.
 * Sin esto la caja da un salto y el texto entra desvanecido sobre un espacio que
 * ya estaba abierto, que es justo el orden inverso al que ocurrió.
 *
 * Pide `overflow-hidden` en el mismo elemento.
 */
export const revelado: Variants = {
  oculto: { opacity: 0, height: 0 },
  visible: { opacity: 1, height: 'auto', transition: SUAVE },
  saliente: { opacity: 0, height: 0, transition: RAPIDO },
}
