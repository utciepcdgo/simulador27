import { useDraggable } from '@dnd-kit/core'
import { IconArrowNarrowRight, IconGripVertical, IconX } from '@tabler/icons-react'
import type { Genero, PerfilCandidato, TokenFormula } from '../domain/types'
import { cuotasAcreditadas, descripcion, esViaOrdinaria } from '../lib/formula'
import { cn } from '../lib/utils'

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
        'inline-flex h-5 min-w-5 items-center justify-center rounded px-1 text-[11px] font-semibold ring-1 ring-inset',
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
  className?: string
}

export function FichaFormula({
  formula,
  arrastrando,
  asidero,
  onQuitar,
  className,
}: FichaProps) {
  const cuotas = cuotasAcreditadas(formula)
  const ordinaria = cuotas.length === 0 && esViaOrdinaria(formula)
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
      <InsigniaGenero perfil={formula.propietario} />
      <IconArrowNarrowRight className="text-muted-foreground size-3.5 shrink-0" aria-hidden />
      <InsigniaGenero perfil={formula.suplente} />
      {cuotas.length > 0 && (
        <span className="text-muted-foreground truncate text-[10px] leading-none">
          {cuotas.join(' · ')}
        </span>
      )}
      {ordinaria && (
        <span
          className="text-muted-foreground/70 truncate text-[10px] leading-none italic"
          title="Combina grupos distintos: candidatura válida que no acredita ninguna medida compensatoria."
        >
          sin medida compensatoria
        </span>
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

/** La misma ficha, conectada al motor de arrastre. */
export function FormulaArrastrable({
  formula,
  activo,
  onQuitar,
}: {
  formula: TokenFormula
  activo: boolean
  onQuitar?: () => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: formula.id,
    disabled: !activo,
  })
  return (
    <div ref={setNodeRef} {...attributes} {...listeners} className={activo ? 'cursor-grab' : ''}>
      <FichaFormula
        formula={formula}
        arrastrando={isDragging}
        asidero={activo}
        onQuitar={onQuitar}
      />
    </div>
  )
}
