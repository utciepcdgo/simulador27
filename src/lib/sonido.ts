import { error003Sound } from './error-003'
import { playSound } from './sound-engine'
import { successChimeSound } from './success-chime'

/**
 * Sonidos de la interfaz.
 *
 * Esta capa envuelve al motor instalado desde soundcn y le añade las dos cosas
 * que un producto necesita y una librería genérica no puede decidir: el volumen
 * y qué hacer cuando el navegador se niega a sonar.
 *
 * No consulta la preferencia de la persona usuaria: eso lo hace quien llama, que
 * ya vive en un componente con acceso a la configuración. Así este módulo no
 * tiene que importar el `store`, que está por encima de él en el orden de
 * dependencias del proyecto.
 */

/**
 * Discretos a propósito.
 *
 * Los clips vienen normalizados a todo volumen, y un pitido a tope en una
 * oficina o en una sesión con público es motivo suficiente para apagar los
 * sonidos y no volver a encenderlos. A un tercio se oyen sin sobresaltar.
 *
 * El de cierre va un poco por debajo del de rechazo: uno avisa de que hay que
 * corregir algo y el otro solo acompaña una buena noticia que ya está en
 * pantalla, así que no tiene por qué reclamar la misma atención.
 */
const VOLUMEN = { rechazo: 0.35, cierre: 0.28 }

/**
 * Suena cuando una regla rechaza un movimiento.
 *
 * Es un canal redundante, no el mensaje: lo que dice qué pasó es el texto con su
 * fundamento. El sonido solo avisa de que algo pasó, para quien no estaba
 * mirando esa parte de la pantalla.
 *
 * No devuelve nada y nunca falla hacia fuera. El navegador puede negarse a
 * reproducir —falta un gesto previo, el dispositivo no tiene salida de audio, la
 * pestaña está silenciada— y ninguno de esos casos debe interrumpir lo que la
 * persona estaba haciendo. El motor devuelve una promesa; sin este `catch` un
 * rechazo del navegador se convertiría en un error sin capturar en la consola.
 */
export function sonarError(): void {
  void playSound(error003Sound.dataUri, { volume: VOLUMEN.rechazo }).catch(() => {
    // Silencio. El aviso visual ya está en pantalla.
  })
}

/**
 * Suena cuando la postulación pasa a cumplir todas las reglas.
 *
 * Mismas garantías que `sonarError`: no devuelve nada y nunca falla hacia fuera.
 */
export function sonarCierre(): void {
  void playSound(successChimeSound.dataUri, { volume: VOLUMEN.cierre }).catch(() => {
    // Silencio. El aviso visual ya está en pantalla.
  })
}
