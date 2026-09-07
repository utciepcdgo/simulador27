import { useState } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { IconAlertTriangle, IconPencil } from '@tabler/icons-react'
import type { ResultadoRegla, TokenFormula } from '../domain/types'
import { revelado } from '../lib/animacion'
import { sonarError } from '../lib/sonido'
import { cuotasAcreditadas, descripcion, esViaOrdinaria, mismosAtributos } from '../lib/formula'
import { useConfiguracion } from '../store/configuracion'
import { useSimulador } from '../store/simulador'
import { CampoPerfil } from './CampoPerfil'
import { Button } from './ui/button'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'

/**
 * Lo que impide el cambio, con la misma voz que el rebote del arrastre: el
 * nombre de la regla, el motivo, y el fundamento aparte y en su propio registro.
 * La ley no se pinta de rojo —no es el error, es lo que lo explica—.
 */
function Impedimento({ rechazo }: { rechazo: ResultadoRegla }) {
  return (
    <m.div
      variants={revelado}
      initial="oculto"
      animate="visible"
      exit="saliente"
      className="overflow-hidden"
      role="alert"
    >
      <div className="border-destructive/30 bg-destructive/5 mt-3 space-y-1.5 rounded-md border p-2.5">
        <p className="text-destructive flex gap-1.5 text-xs font-medium">
          <IconAlertTriangle className="mt-px size-3.5 shrink-0" aria-hidden />
          {rechazo.regla}
        </p>
        <p className="text-xs leading-snug">{rechazo.mensaje}</p>
        <blockquote className="text-muted-foreground border-l pl-2.5 text-[0.6875rem] leading-relaxed whitespace-pre-line">
          {rechazo.fundamento_legal}
        </blockquote>
      </div>
    </m.div>
  )
}

/**
 * Cambia los atributos de una fórmula sin sacarla de su distrito.
 *
 * Editar en el sitio evita el rodeo de devolverla a la bandeja, corregirla y
 * volver a arrastrarla, que es lo que se hacía hasta ahora para mover un género.
 * Lo que no evita es ninguna regla: el cambio pasa por las mismas puertas que un
 * arrastre, y si alguna lo rechaza, el motivo se lee aquí mismo —con su
 * fundamento— y la fórmula se queda como estaba.
 *
 * Los cambios no se aplican al vuelo. Un dictamen que se recalcula a cada
 * `select` haría parpadear el panel entero mientras se piensa; se confirman.
 */
export function EditorFormula({
  formula,
  onListo,
}: {
  formula: TokenFormula
  onListo: () => void
}) {
  const modificarFormula = useSimulador((s) => s.modificarFormula)
  const conSonido = useConfiguracion((c) => c.opciones.sonidos)
  const [propietario, setPropietario] = useState(formula.propietario)
  const [suplente, setSuplente] = useState(formula.suplente)
  const [replicar, setReplicar] = useState(() =>
    mismosAtributos(formula.propietario, formula.suplente),
  )
  const [rechazo, setRechazo] = useState<ResultadoRegla | null>(null)

  const suplenteEfectivo = replicar ? propietario : suplente
  const previa: TokenFormula = { ...formula, propietario, suplente: suplenteEfectivo }
  const cuotas = cuotasAcreditadas(previa)
  const sinCambios =
    mismosAtributos(propietario, formula.propietario) &&
    mismosAtributos(suplenteEfectivo, formula.suplente)

  // El motivo del rechazo describe unos atributos concretos; en cuanto se tocan,
  // deja de hablar de lo que hay en pantalla.
  function cambiar(aplicar: () => void) {
    setRechazo(null)
    aplicar()
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        const impedimento = modificarFormula(formula.id, propietario, suplenteEfectivo)
        if (impedimento) {
          setRechazo(impedimento)
          if (conSonido) sonarError()
        } else onListo()
      }}
    >
      <h2 className="text-sm font-medium">Modificar la fórmula</h2>

      {/*
        Los dos perfiles van uno debajo del otro y no en dos columnas: a lo ancho
        de un popover, «Diversidad Sexual» no cabe en el disparador del select y
        la casilla de la edad se parte en cuatro renglones.
      */}
      <CampoPerfil
        titulo="Persona propietaria"
        sujeto="persona propietaria"
        perfil={propietario}
        onCambio={(p) => cambiar(() => setPropietario(p))}
      />

      <label className="text-muted-foreground flex items-center gap-2 border-t pt-3 text-sm">
        <input
          type="checkbox"
          className="accent-primary size-4"
          checked={replicar}
          onChange={(e) =>
            cambiar(() => {
              setReplicar(e.target.checked)
              if (!e.target.checked) setSuplente(propietario)
            })
          }
        />
        Suplencia con los mismos atributos
      </label>

      {/*
        La suplencia solo se dibuja cuando difiere. Repetir los tres campos en
        gris, deshabilitados, para decir lo mismo que ya dice la casilla, es
        doblar la altura del panel a cambio de nada.
      */}
      <AnimatePresence initial={false}>
        {!replicar && (
          <m.div
            variants={revelado}
            initial="oculto"
            animate="visible"
            exit="saliente"
            className="overflow-hidden"
          >
            <CampoPerfil
              titulo="Persona suplente"
              sujeto="persona suplente"
              perfil={suplente}
              onCambio={(p) => cambiar(() => setSuplente(p))}
            />
          </m.div>
        )}
      </AnimatePresence>

      <p className="text-muted-foreground border-t pt-3 text-xs leading-snug">
        {cuotas.length > 0 ? (
          <>
            Acreditará: <span className="text-foreground font-medium">{cuotas.join(' · ')}</span>
          </>
        ) : esViaOrdinaria(previa) ? (
          <>
            La fórmula combina grupos distintos: es válida y se registra sin medida compensatoria,
            pero no acredita ninguna.
          </>
        ) : (
          'No acredita ninguna medida compensatoria.'
        )}
      </p>

      <AnimatePresence initial={false}>
        {rechazo && <Impedimento key={rechazo.regla} rechazo={rechazo} />}
      </AnimatePresence>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onListo}>
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={sinCambios}>
          Guardar cambios
        </Button>
      </div>
    </form>
  )
}

/**
 * El editor colgado de un botón propio.
 *
 * Es la puerta del modo sin arrastre, donde la fórmula no se dibuja como ficha
 * sino como el valor de un `Select` y no hay nada que pulsar.
 */
export function BotonEditarFormula({ formula }: { formula: TokenFormula }) {
  const [abierto, setAbierto] = useState(false)
  const editable = useConfiguracion((c) => c.opciones.mostrarEditorFormulas)
  if (!editable) return null
  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverTrigger
        aria-label={`Modificar ${descripcion(formula)}`}
        title="Modificar los atributos de esta fórmula"
        className="text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring size-8 shrink-0 rounded-md transition-colors outline-none focus-visible:ring-[3px]"
      >
        <IconPencil className="mx-auto size-4" />
      </PopoverTrigger>
      <PopoverContent className="w-[22rem]">
        <EditorFormula formula={formula} onListo={() => setAbierto(false)} />
      </PopoverContent>
    </Popover>
  )
}
