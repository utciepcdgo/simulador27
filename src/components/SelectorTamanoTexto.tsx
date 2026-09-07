import { cn } from '../lib/utils'
import { useTamanoTexto, type TamanoTexto } from '../lib/tipografia'

/**
 * Cada opción se rotula a su propio tamaño.
 *
 * `muestra` es el tamaño en que se dibuja la «Aa» y el rótulo dentro del botón,
 * no el que se aplicará: es la manera de ver lo que se elige antes de elegirlo,
 * y ahorra el ensayo y error de aplicar, mirar la pantalla y volver a abrir la
 * configuración.
 */
const OPCIONES: readonly { valor: TamanoTexto; etiqueta: string; muestra: string }[] = [
  { valor: 'sistema', etiqueta: 'Seguir al sistema', muestra: 'text-sm' },
  { valor: 'pequeno', etiqueta: 'Pequeño', muestra: 'text-xs' },
  { valor: 'mediano', etiqueta: 'Mediano', muestra: 'text-sm' },
  { valor: 'grande', etiqueta: 'Grande', muestra: 'text-lg' },
]

export function SelectorTamanoTexto() {
  const [tamano, elegir] = useTamanoTexto()

  return (
    <div
      role="radiogroup"
      aria-label="Tamaño del texto"
      className="grid grid-cols-2 gap-2 sm:grid-cols-4"
    >
      {OPCIONES.map(({ valor, etiqueta, muestra }) => {
        const activo = tamano === valor
        return (
          <button
            key={valor}
            type="button"
            role="radio"
            aria-checked={activo}
            onClick={() => elegir(valor)}
            className={cn(
              'focus-visible:ring-ring flex min-h-16 flex-col items-center justify-center gap-1 rounded-md border p-2 text-center transition-colors outline-none focus-visible:ring-[3px]',
              activo
                ? 'border-foreground/30 bg-muted text-foreground'
                : 'text-muted-foreground hover:border-foreground/20 hover:text-foreground',
            )}
          >
            <span className={cn('leading-none font-semibold', muestra)} aria-hidden>
              Aa
            </span>
            <span className={cn('leading-tight text-balance', muestra)}>{etiqueta}</span>
          </button>
        )
      })}
    </div>
  )
}
