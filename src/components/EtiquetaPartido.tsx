import { nombreDe, siglasDe } from '../domain/catalogo'
import type { IdPartido } from '../domain/types'
import { cn } from '../lib/utils'
import { EmblemaPartido } from './EmblemaPartido'

const TAMANO = {
  sm: 'size-3.5',
  md: 'size-4',
  lg: 'size-5',
} as const

/**
 * El nombre de un partido, con su emblema.
 *
 * Un componente y no un fragmento repetido en cada sitio porque las siglas
 * aparecen en siete lugares distintos —encabezado, columnas del convenio,
 * pestañas, títulos de tablero, dictamen, balance— y basta con que dos de ellos
 * separen el emblema del texto de forma distinta para que la interfaz se vea
 * hecha por dos manos.
 *
 * El emblema va como `decorativo`: las siglas ya están escritas al lado, así que
 * no aporta información propia y su fallo debe colapsar a nada en vez de
 * imprimirlas dos veces.
 */
export function EtiquetaPartido({
  partido,
  tamano = 'md',
  className,
}: {
  partido: IdPartido
  tamano?: keyof typeof TAMANO
  className?: string
}) {
  return (
    <span
      className={cn('inline-flex min-w-0 items-center gap-1.5', className)}
      title={nombreDe(partido)}
    >
      <EmblemaPartido
        partido={partido}
        decorativo
        className={cn('shrink-0 rounded-[2px]', TAMANO[tamano])}
      />
      <span className="truncate">{siglasDe(partido)}</span>
    </span>
  )
}

/**
 * Solo el emblema, para acompañar a un texto que ya trae las siglas dentro.
 *
 * Lo usan el dictamen y los tableros, donde el rótulo es la etiqueta completa
 * del ámbito —«PRI · paridad global»— y repetir las siglas al lado sería
 * tartamudear.
 */
export function EmblemasDe({
  partidos,
  tamano = 'md',
  className,
}: {
  partidos: readonly IdPartido[]
  tamano?: keyof typeof TAMANO
  className?: string
}) {
  if (partidos.length === 0) return null
  return (
    <span className={cn('inline-flex shrink-0 items-center gap-1', className)}>
      {partidos.map((partido) => (
        <EmblemaPartido
          key={partido}
          partido={partido}
          decorativo
          className={cn('shrink-0 rounded-[2px]', TAMANO[tamano])}
        />
      ))}
    </span>
  )
}
