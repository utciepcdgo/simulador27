import { AnimatePresence, m } from 'motion/react'
import { tinteDeEmblemas } from '../lib/emblemas'
import { useSimulador } from '../store/simulador'

/**
 * Tinte de los emblemas del postulante en la franja superior de la pantalla.
 *
 * Se derivan los colores del emblema en vez de desenfocar la imagen. El emblema
 * desenfocado se veía mejor sobre el papel, pero depende de que el servidor de
 * emblemas responda —si no, la franja queda vacía— y su resultado es
 * incontrolable: PAN, PAZ y PV son mayoritariamente blancos, así que el
 * desenfoque produciría una mancha clara, invisible en tema claro y deslumbrante
 * en el oscuro. Un tinte plano se comporta igual en los dos temas y no viaja por
 * la red.
 *
 * Va detrás de todo con `-z-10` y sin capturar el puntero: es atmósfera, no
 * superficie. La opacidad cambia por tema porque el mismo color necesita menos
 * presencia sobre blanco que sobre negro.
 */
export function FondoMica() {
  const postulante = useSimulador((s) => s.postulante)
  const integrantes = postulante?.integrantes ?? []

  return (
    <AnimatePresence>
      {integrantes.length > 0 && (
        <m.div
          // Cambiar de postulante rehace el tinte: la llave provoca el relevo.
          key={integrantes.join('-')}
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-1/2"
        >
          <div
            className="size-full opacity-[0.28] dark:opacity-[0.28]"
            style={{ backgroundImage: tinteDeEmblemas(integrantes) }}
          />
        </m.div>
      )}
    </AnimatePresence>
  )
}
