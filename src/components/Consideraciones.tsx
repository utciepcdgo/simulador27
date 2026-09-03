import { useState } from 'react'
import { IconAlertTriangle, IconDatabaseOff } from '@tabler/icons-react'
import { Button } from './ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card'

/**
 * Puerta de entrada al simulador.
 *
 * El acuerdo no se recuerda entre sesiones a propósito. La primera consideración
 * dice que nada de lo que la persona usuaria ingrese se almacena, y guardar en
 * su navegador la marca de que ya leyó eso contradiría el mensaje en el mismo
 * acto de darlo. Vuelve a mostrarse en cada visita, que para una advertencia
 * legal es lo correcto.
 */
export function Consideraciones({ onAceptar }: { onAceptar: () => void }) {
  const [aceptado, setAceptado] = useState(false)

  return (
    <Card className="mx-auto max-w-xl gap-5">
      <CardHeader>
        <CardTitle className="text-base">Antes de comenzar</CardTitle>
      </CardHeader>

      <CardContent>
        <ol className="space-y-4">
          <li className="flex gap-3">
            <IconDatabaseOff className="text-muted-foreground mt-0.5 size-5 shrink-0" aria-hidden />
            <p className="text-sm leading-relaxed">
              La información que el usuario ingrese en el Simulador{' '}
              <strong>no se almacena por ningún motivo</strong>, tenga a bien guardar su archivo de
              configuración si así lo desea.
            </p>
          </li>
          <li className="flex gap-3">
            <IconAlertTriangle
              className="text-muted-foreground mt-0.5 size-5 shrink-0"
              aria-hidden
            />
            <p className="text-sm leading-relaxed">
              Este sistema es una herramienta didáctica que <strong>NO</strong> sustituye la
              revisión que se hará al momento del registro de candidaturas.
            </p>
          </li>
        </ol>
      </CardContent>

      <CardFooter className="flex-col items-stretch gap-3">
        <label className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded-md border p-3 text-sm">
          <input
            type="checkbox"
            className="accent-primary size-4"
            checked={aceptado}
            onChange={(e) => setAceptado(e.target.checked)}
          />
          Estoy de acuerdo
        </label>
        <Button disabled={!aceptado} onClick={onAceptar}>
          Continuar
        </Button>
      </CardFooter>
    </Card>
  )
}
