import { useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { IconArrowNarrowRight, IconGripVertical, IconX } from '@tabler/icons-react'
import type { Genero, PerfilCandidato, TokenFormula } from '../domain/types'
import { cuotasAcreditadas, descripcion, esViaOrdinaria } from '../lib/formula'
import { cn } from '../lib/utils'
import { useConfiguracion } from '../store/configuracion'
import { EditorFormula } from './EditorFormula'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'

const ABREVIATURA: Record<Genero, string> = {
  Mujer: 'M',
  Hombre: 'H',
  'No Binario': 'NB',
}

const ESTILO_GENERO: Record<Genero, string> = {
  Mujer: 'bg-fuchsia-500/15 text-fuchsia-700 ring-fuchsia-500/30 dark:text-fuchsia-300',
  Hombre: 'bg-sky-500/15 text-sky-700 ring-sky-500/30 dark:text-sky-300',
  'No Binario': 'bg-violet-500/15 text-violet-700 ring-violet-500/30 dark:text-violet-300',
}

function InsigniaGenero({ perfil }: { perfil: PerfilCandidato }) {
  return (
    <span
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded px-1 text-[0.6875rem] font-semibold ring-1 ring-inset',
        ESTILO_GENERO[perfil.genero],
      )}
    >
      {ABREVIATURA[perfil.genero]}
    </span>
  )
}

interface FichaProps {
  formula: TokenFormula
  arrastrando?: boolean
  asidero?: boolean
  onQuitar?: () => void
  /** Abre el editor de atributos al pulsar la ficha. */
  editable?: boolean
  /** Avisa a quien la arrastra de que el editor está abierto. */
  onEditando?: (abierto: boolean) => void
  className?: string
}

export function FichaFormula({
  formula,
  arrastrando,
  asidero,
  onQuitar,
  editable,
  onEditando,
  className,
}: FichaProps) {
  const cuotas = cuotasAcreditadas(formula)
  const ordinaria = cuotas.length === 0 && esViaOrdinaria(formula)
  const [abierto, setAbierto] = useState(false)

  function alternar(valor: boolean) {
    setAbierto(valor)
    onEditando?.(valor)
  }

  // Los atributos de la fórmula, que es también lo que se pulsa para cambiarlos.
  const cuerpo = (
    <>
      <InsigniaGenero perfil={formula.propietario} />
      <IconArrowNarrowRight className="text-muted-foreground size-3.5 shrink-0" aria-hidden />
      <InsigniaGenero perfil={formula.suplente} />
      {cuotas.length > 0 && (
        <span className="text-muted-foreground truncate text-[0.625rem] leading-none">
          {cuotas.join(' · ')}
        </span>
      )}
      {ordinaria && (
        <span
          className="text-muted-foreground/70 truncate text-[0.625rem] leading-none italic"
          title="Combina grupos distintos: candidatura válida que no acredita ninguna medida compensatoria."
        >
          sin medida compensatoria
        </span>
      )}
    </>
  )

  return (
    <div
      className={cn(
        'bg-card flex items-center gap-1.5 rounded-md border px-1.5 py-1 shadow-xs',
        arrastrando && 'opacity-40',
        className,
      )}
      aria-label={descripcion(formula)}
    >
      {asidero && (
        <IconGripVertical className="text-muted-foreground size-3.5 shrink-0" aria-hidden />
      )}
      {editable ? (
        <Popover open={abierto} onOpenChange={alternar}>
          <PopoverTrigger
            title="Modificar los atributos de esta fórmula"
            className="hover:bg-muted focus-visible:ring-ring -my-1 -ml-1.5 flex min-w-0 flex-1 items-center gap-1.5 rounded py-1 pl-1.5 text-left transition-colors outline-none focus-visible:ring-[3px]"
          >
            {cuerpo}
          </PopoverTrigger>
          <PopoverContent align="start" className="w-[22rem]">
            <EditorFormula formula={formula} onListo={() => alternar(false)} />
          </PopoverContent>
        </Popover>
      ) : (
        cuerpo
      )}
      {onQuitar && (
        <button
          type="button"
          onClick={onQuitar}
          className="text-muted-foreground hover:bg-muted hover:text-foreground ml-auto rounded p-0.5"
          aria-label={`Quitar ${descripcion(formula)}`}
        >
          <IconX className="size-3.5" />
        </button>
      )}
    </div>
  )
}

/**
 * La misma ficha, conectada al motor de arrastre.
 *
 * Mientras el editor está abierto la ficha no se arrastra: el `popover` queda
 * anclado a ella y verla salir volando con el formulario detrás no ayuda a nadie.
 * El umbral de 4 px del sensor ya distingue el clic del arrastre, así que pulsar
 * para editar y tirar para mover conviven en la misma superficie.
 */
export function FormulaArrastrable({
  formula,
  activo,
  onQuitar,
}: {
  formula: TokenFormula
  activo: boolean
  onQuitar?: () => void
}) {
  const [editando, setEditando] = useState(false)
  const editable = useConfiguracion((c) => c.opciones.mostrarEditorFormulas)
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: formula.id,
    disabled: !activo || editando,
  })
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={activo && !editando ? 'cursor-grab' : 'cursor-default'}
    >
      <FichaFormula
        formula={formula}
        arrastrando={isDragging}
        asidero={activo}
        onQuitar={onQuitar}
        editable={editable}
        onEditando={setEditando}
      />
    </div>
  )
}
