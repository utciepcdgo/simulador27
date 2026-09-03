import { IconDeviceDesktop, IconMoon, IconSun } from '@tabler/icons-react'
import type { Icon } from '@tabler/icons-react'
import { cn } from '../lib/utils'
import { useTema, type Tema } from '../lib/tema'

const OPCIONES: readonly { valor: Tema; etiqueta: string; Icono: Icon }[] = [
  { valor: 'sistema', etiqueta: 'Seguir al sistema', Icono: IconDeviceDesktop },
  { valor: 'claro', etiqueta: 'Modo claro', Icono: IconSun },
  { valor: 'oscuro', etiqueta: 'Modo oscuro', Icono: IconMoon },
]

/**
 * Control de tres estados, no un interruptor de dos: "seguir al sistema" es una
 * opción propia y la de origen. Un interruptor claro/oscuro obligaría a elegir
 * un bando y perdería la preferencia que la persona ya expresó en su equipo.
 */
export function SelectorTema() {
  const [tema, elegir] = useTema()

  return (
    <div
      role="group"
      aria-label="Tema de la interfaz"
      className="bg-muted inline-flex items-center rounded-lg p-[3px]"
    >
      {OPCIONES.map(({ valor, etiqueta, Icono }) => {
        const activo = tema === valor
        return (
          <button
            key={valor}
            type="button"
            title={etiqueta}
            aria-label={etiqueta}
            aria-pressed={activo}
            onClick={() => elegir(valor)}
            className={cn(
              'focus-visible:ring-ring flex size-7 items-center justify-center rounded-md transition-colors focus-visible:ring-[3px] focus-visible:outline-none',
              activo
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icono className="size-4" aria-hidden />
          </button>
        )
      })}
    </div>
  )
}
