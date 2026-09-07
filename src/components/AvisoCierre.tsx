import {useEffect, useState} from 'react'
import {IconCircleCheck} from '@tabler/icons-react'
import {sonarCierre} from '../lib/sonido'
import {useConfiguracion} from '../store/configuracion'
import {useDictamen} from '../store/dictamen'
import {DescargarDictamen} from './DescargarDictamen'
import {Button} from './ui/button'
import {Dialog, DialogContent, DialogDescription, DialogTitle} from './ui/dialog'

/**
 * Avisa cuando la postulación pasa a cumplir todas las reglas.
 *
 * Se dispara en la **transición**, no mientras el estado se mantiene: aparece
 * una vez por cada vez que la revisión preliminar queda en verde. Si después se
 * deshace algo y se vuelve a cerrar, vuelve a aparecer, porque cada cierre es
 * una noticia distinta y no un repintado del mismo.
 *
 * El botón de descarga se repite aquí en lugar de mudarse: quien llega a este
 * punto lo quiere a la mano en el momento, y quien lo cierra para seguir
 * probando lo quiere donde siempre estuvo. Es el mismo componente, sin su marco.
 */
export function AvisoCierre() {
    const dictamen = useDictamen()
    const conSonido = useConfiguracion((c) => c.opciones.sonidos)
    const cerrable = dictamen?.cerrable ?? false

    const [previo, setPrevio] = useState(cerrable)
    const [abierto, setAbierto] = useState(false)

    // Ajuste de estado durante el render, no en un efecto: así el diálogo aparece
    // en el mismo pintado en que la última regla se cumple, sin el fotograma de
    // retraso que deja un `setState` dentro de `useEffect`.
    if (previo !== cerrable) {
        setPrevio(cerrable)
        if (cerrable) setAbierto(true)
    }

    // El sonido sí va en un efecto: es un efecto, y sonar durante el render sería
    // un lado oscuro del que React no puede protegernos.
    useEffect(() => {
        if (abierto && conSonido) sonarCierre()
    }, [abierto, conSonido])

    if (!dictamen) return null

    return (
        <Dialog open={abierto} onOpenChange={setAbierto}>
            <DialogContent className="sm:max-w-md">
                <div className="space-y-3">
                    <IconCircleCheck className="size-9 text-emerald-600" aria-hidden/>
                    <DialogTitle className="text-lg leading-tight">
                        Has concluído con éxito
                    </DialogTitle>
                    <DialogDescription className="space-y-2 text-sm leading-snug">
            <span className="block">
              Las {dictamen.resultados.length} reglas de la revisión preliminar quedaron cumplidas
              y ya puedes descargar el resultado en PDF.
            </span>
                        <span className="block">
              O, continúa probando escenarios. También puedes descargar el resultado desde el panel de revisión preliminar.
            </span>
                    </DialogDescription>
                </div>

                <DescargarDictamen cerrable pendientes={0} enDialogo/>

                {/*
          La advertencia va justo aquí y no en un rincón. Un aviso de
          enhorabuena es el momento en que alguien puede confundir «cumple las
          reglas que este simulador evalúa» con «ya está registrado», y es
          precisamente donde hay que decir que no.
        */}
                <p className="text-muted-foreground border-t pt-3 text-xs leading-snug">
                    Esto es un ensayo. El documento no sustituye la revisión que se hará al momento del
                    registro de candidaturas.
                </p>

                <Button variant="ghost" size="default" onClick={() => setAbierto(false)}>
                    Seguir probando
                </Button>
            </DialogContent>
        </Dialog>
    )
}
