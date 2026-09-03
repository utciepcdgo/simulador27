import { useState } from 'react'
import { emblemaDe, nombreDe, siglasDe } from '../domain/catalogo'
import type { IdPartido } from '../domain/types'
import { cn } from '../lib/utils'

/**
 * Emblema oficial de un partido, con las siglas de respaldo.
 *
 * Los emblemas viven en un servidor externo. Si no cargan —red caída, host
 * inaccesible— la casilla no puede quedarse en blanco: sin emblema y sin siglas
 * no habría forma de saber a quién se está eligiendo, así que el fallo se
 * degrada a texto en vez de a nada.
 *
 * `decorativo` invierte esa decisión para los lugares donde el emblema acompaña
 * a unas siglas que ya están escritas al lado. Ahí no carga ninguna información
 * por su cuenta, y degradar a texto imprimiría las siglas dos veces.
 *
 * Los archivos no comparten proporción: la mayoría son cuadrados y traen su
 * propio fondo opaco, pero PESD es vertical y PER es un logotipo horizontal de
 * 409×57 con fondo transparente. Por eso el tamaño se fija con una caja y
 * `object-contain`, nunca con un alto suelto: así el más ancho de todos se
 * encaja dentro en vez de desbordar la fila.
 */
export function EmblemaPartido({
  partido,
  className,
  decorativo = false,
}: {
  partido: IdPartido
  className?: string
  decorativo?: boolean
}) {
  const [fallo, setFallo] = useState(false)
  const siglas = siglasDe(partido)

  if (fallo) {
    if (decorativo) return null
    return (
      <span
        className={cn(
          'flex items-center justify-center text-center text-xs leading-tight font-semibold',
          className,
        )}
      >
        {siglas}
      </span>
    )
  }

  return (
    <img
      src={emblemaDe(partido)}
      alt=""
      // Sin `title` cuando es decorativo: quien lo usa así ya rotula el conjunto,
      // y dos tooltips anidados se pisan.
      title={decorativo ? undefined : nombreDe(partido)}
      loading="lazy"
      onError={() => setFallo(true)}
      className={cn('object-contain', className)}
    />
  )
}
