import type { PerfilCandidato } from '../domain/types'
import { ACCIONES, GENEROS } from '../lib/formula'
import { ROTULO_GENERO, ROTULO_GRUPO } from '../lib/rotulos'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'

function opciones<T extends string>(valores: readonly T[], rotulo: (valor: T) => string) {
  return valores.map((valor) => ({ label: rotulo(valor), value: valor }))
}

/**
 * Un lado de la fórmula: los tres atributos con los que se postula una persona.
 *
 * Lo usan el creador de fórmulas y el editor de una ya colocada, que son la
 * misma decisión tomada en dos momentos. `sujeto` viaja aparte del rótulo
 * visible porque los dos textos ya no derivan uno del otro: el rótulo dice
 * «Persona propietaria» —artículo 5 de los Lineamientos— y las etiquetas
 * accesibles dicen «de la persona propietaria». Derivar la segunda de la primera
 * produciría «la persona persona propietaria».
 */
export function CampoPerfil({
  titulo,
  sujeto,
  perfil,
  onCambio,
  deshabilitado,
}: {
  titulo: string
  sujeto: string
  perfil: PerfilCandidato
  onCambio: (perfil: PerfilCandidato) => void
  deshabilitado?: boolean
}) {
  return (
    <fieldset className="min-w-0 space-y-2" disabled={deshabilitado}>
      <legend className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
        {titulo}
      </legend>

      <Select
        items={opciones(GENEROS, (g) => ROTULO_GENERO[g])}
        value={perfil.genero}
        onValueChange={(valor) => onCambio({ ...perfil, genero: valor as PerfilCandidato['genero'] })}
      >
        <SelectTrigger className="w-full" aria-label={`Género de la ${sujeto}`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {GENEROS.map((g) => (
            <SelectItem key={g} value={g}>
              {ROTULO_GENERO[g]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        items={opciones(ACCIONES, (a) => ROTULO_GRUPO[a])}
        value={perfil.accionAfirmativa}
        onValueChange={(valor) =>
          onCambio({ ...perfil, accionAfirmativa: valor as PerfilCandidato['accionAfirmativa'] })
        }
      >
        <SelectTrigger className="w-full" aria-label={`Medida compensatoria de la ${sujeto}`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ACCIONES.map((a) => (
            <SelectItem key={a} value={a}>
              {ROTULO_GRUPO[a]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/*
        La fecha de corte es materia de procedencia del registro —artículo
        186.6.c de la LIPEED—, así que no puede quedarse implícita en la casilla.
      */}
      <label className="flex items-start gap-2 text-sm leading-snug">
        <input
          type="checkbox"
          aria-label={`${sujeto} de hasta 30 años cumplidos al día de la elección`}
          className="accent-primary mt-0.5 size-4 shrink-0"
          checked={perfil.esJoven}
          onChange={(e) => onCambio({ ...perfil, esJoven: e.target.checked })}
        />
        Hasta 30 años cumplidos al día de la elección
      </label>
    </fieldset>
  )
}
