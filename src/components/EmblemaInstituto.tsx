import { useState } from 'react'
import { cn } from '../lib/utils'

/**
 * Una versión por tema, servidas por la propia aplicación.
 *
 * `LOGO_O` es la de tinta oscura, para el tema claro; `LOGO_B` la blanca, para
 * el oscuro. Antes había un solo archivo, de tinta oscura y traído de un bucket
 * externo, que en tema oscuro se perdía contra el fondo: por eso iba sobre una
 * plancha blanca. Con la versión blanca esa plancha deja de hacer falta, y el
 * emblema ocupa el sitio que ella ocupaba.
 */
const LOGO_CLARO = 'LOGO_O.png'
const LOGO_OSCURO = 'LOGO_B.png'

const INSTITUTO = 'Instituto Electoral y de Participación Ciudadana del Estado de Durango'

/**
 * Emblema institucional del encabezado.
 *
 * El tema se resuelve con CSS y no leyendo el tema en React, a propósito: el
 * script en línea de `index.html` pone la clase `dark` antes del primer pintado,
 * así que la versión correcta ya es la visible en el primer fotograma. Un hook
 * no lo sabría hasta montar, y el emblema parpadearía al cargar. Las dos
 * imágenes se descargan —nueve kilobytes entre ambas— y la oculta sale del árbol
 * de accesibilidad con ella, así que el nombre no se anuncia dos veces.
 *
 * Si el archivo no carga, quedan las siglas: este es el único lugar de la
 * interfaz que identifica a la institución, y no puede quedarse en blanco.
 */
export function EmblemaInstituto({ className }: { className?: string }) {
  const [fallo, setFallo] = useState(false)
  // `BASE_URL` delante, por lo mismo que los emblemas de partido y la trama: el
  // sitio puede publicarse bajo una subruta, y una barra inicial fija rompería
  // ese despliegue.
  const base = import.meta.env.BASE_URL

  if (fallo) {
    return (
      <span
        className={cn('text-foreground shrink-0 text-base font-semibold tracking-tight', className)}
        title={INSTITUTO}
      >
        IEPC Durango
      </span>
    )
  }

  // El emblema es horizontal —225×100—, así que se fija el alto y el ancho
  // sigue. A `sm` llega a 48 px, y con el texto en «Mayor» a 72: tres cuartas
  // partes del original, que es donde todavía se ve nítido.
  const medidas = 'h-11 w-auto shrink-0 sm:h-12'

  return (
    <span className={cn('inline-flex shrink-0 items-center', className)}>
      <img
        src={`${base}${LOGO_CLARO}`}
        width={225}
        height={100}
        alt={INSTITUTO}
        onError={() => setFallo(true)}
        className={cn(medidas, 'dark:hidden')}
      />
      <img
        src={`${base}${LOGO_OSCURO}`}
        width={225}
        height={100}
        alt={INSTITUTO}
        onError={() => setFallo(true)}
        className={cn('hidden', medidas, 'dark:block')}
      />
    </span>
  )
}
