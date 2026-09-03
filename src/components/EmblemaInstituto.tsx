import { useState } from 'react'
import { cn } from '../lib/utils'

const LOGOTIPO = 'https://s3.us-east-1.amazonaws.com/static.appsiepcdurango.mx/emblemas/LOGO2023.png'

const INSTITUTO = 'Instituto Electoral y de Participación Ciudadana del Estado de Durango'

/**
 * Emblema institucional del encabezado, siempre sobre plancha blanca.
 *
 * El archivo tiene fondo transparente y tinta oscura —luminancia media de 83
 * sobre 255—, así que en tema oscuro se perdería contra el fondo. Invertirlo o
 * recolorearlo no es opción: un emblema oficial se reproduce como es.
 *
 * La plancha resuelve las dos cosas con una sola regla y sin variante `dark:`.
 * En tema claro el fondo de la página ya es blanco puro, así que la plancha no
 * se ve; en oscuro se convierte en el campo de protección que la marca necesita.
 *
 * Si el archivo no carga, quedan las siglas: este es el único lugar de la
 * interfaz que identifica a la institución, y no puede quedarse en blanco.
 */
export function EmblemaInstituto({ className }: { className?: string }) {
  const [fallo, setFallo] = useState(false)

  return (
    <div
      className={cn(
        'flex h-11 shrink-0 items-center justify-center rounded-md bg-white px-2 sm:h-12',
        className,
      )}
    >
      {fallo ? (
        // Color fijo, no `text-foreground`: la plancha es blanca en los dos temas.
        <span className="text-sm font-semibold tracking-tight text-neutral-900" title={INSTITUTO}>
          IEPC Durango
        </span>
      ) : (
        <img
          src={LOGOTIPO}
          width={746}
          height={333}
          alt={INSTITUTO}
          onError={() => setFallo(true)}
          className="h-7 w-auto sm:h-8"
        />
      )}
    </div>
  )
}
