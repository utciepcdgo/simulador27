import { nombreDe, siglasDe } from '../domain/catalogo'
import type { IdPartido } from '../domain/types'
import { cn } from '../lib/utils'
import { EmblemaPartido } from './EmblemaPartido'

/**
 * La escala del emblema, en `rem`.
 *
 * El techo no es el valor que se declara aquí: el selector de tamaño de texto
 * escala la raíz, y con «Mayor» al 150% todo lo medido en `rem` se multiplica.
 * Así que el tamaño real de cada paso es este por uno y medio, y es contra esa
 * cifra contra la que hay que mirar el límite.
 *
 * Y el límite es el archivo. Los emblemas de `public/emblemas/` son PNG de
 * 97×97: por encima de eso no hay más imagen que mostrar, solo interpolación.
 * El paso mayor de todos —el selector de partidos con el texto en «Mayor»— se
 * queda en 72 px, tres cuartas partes del original, que es donde todavía se ven
 * nítidos. Antes de subir cualquiera de estos valores, multiplíquese por 1.5.
 */
const TAMANO = {
  sm: 'size-5',
  md: 'size-6',
  lg: 'size-8',
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
