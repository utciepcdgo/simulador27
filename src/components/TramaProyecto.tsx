import { MODO_PROYECTO } from '../lib/proyecto'

/**
 * Trama de «PROYECTO» repetida sobre toda la herramienta.
 *
 * Es una advertencia, no un adorno: mientras el simulador no sea definitivo,
 * cualquier captura de pantalla que circule tiene que llevar dicho en su propia
 * cara que lo que se ve es un ensayo.
 *
 * Va fija al viewport y no al documento, así que la trama se queda quieta
 * mientras el contenido se desplaza. Es lo que la hace leerse como una textura
 * del papel y no como parte de la página.
 *
 * Tres cautelas que la vuelven inocua:
 *
 * - `pointer-events-none`, para que no intercepte ni un clic.
 * - `aria-hidden`, porque quien navega con lector de pantalla no necesita oír
 *   noventa veces la misma palabra; el aviso le llega por el texto de la
 *   herramienta.
 * - `z-40`, por debajo de los diálogos y los popovers, que van en `z-50`. La
 *   trama cubre el sitio; lo que se abre encima para ser leído se queda limpio.
 *
 * Las dos tramas se alternan por CSS y no por JavaScript: así el cambio de tema
 * no tiene un fotograma en el que se vea la que no toca.
 */
export function TramaProyecto() {
  if (!MODO_PROYECTO) return null

  // `BASE_URL` delante, por lo mismo que los emblemas: el sitio puede publicarse
  // bajo una subruta, y una barra inicial fija rompería ese despliegue.
  const base = import.meta.env.BASE_URL

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-40">
      <div
        className="absolute inset-0 dark:hidden"
        style={{ backgroundImage: `url(${base}PROYECTO_MC.png)` }}
      />
      <div
        className="absolute inset-0 hidden dark:block"
        style={{ backgroundImage: `url(${base}PROYECTO_MO.png)` }}
      />
    </div>
  )
}
