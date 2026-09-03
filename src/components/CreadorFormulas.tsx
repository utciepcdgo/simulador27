import { useState } from 'react'
import { IconPlus } from '@tabler/icons-react'
import type { AccionAfirmativa, Genero, PerfilCandidato } from '../domain/types'
import { cuotasAcreditadas, esViaOrdinaria } from '../lib/formula'
import { ROTULO_GENERO, ROTULO_GRUPO } from '../lib/rotulos'
import { useSimulador } from '../store/simulador'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'

const GENEROS: Genero[] = ['Mujer', 'Hombre', 'No Binario']

const ACCIONES: AccionAfirmativa[] = [
  'Ninguna',
  'Indígena',
  'Discapacidad',
  'Diversidad Sexual',
  'Adulto Mayor',
  'Migrante',
]

const PERFIL_INICIAL: PerfilCandidato = {
  genero: 'Mujer',
  esJoven: false,
  accionAfirmativa: 'Ninguna',
}

function opciones(valores: readonly string[], rotulo: (valor: string) => string) {
  return valores.map((valor) => ({ label: rotulo(valor), value: valor }))
}

/**
 * Un lado de la fórmula.
 *
 * `sujeto` viaja aparte del rótulo visible porque los dos textos ya no derivan
 * uno del otro: el rótulo dice «Persona propietaria» —artículo 5 de los
 * Lineamientos— y las etiquetas accesibles dicen «de la persona propietaria».
 * Derivar la segunda de la primera produciría «la persona persona propietaria».
 */
function CampoPerfil({
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
        items={opciones(GENEROS, (g) => ROTULO_GENERO[g as Genero])}
        value={perfil.genero}
        onValueChange={(valor) => onCambio({ ...perfil, genero: valor as Genero })}
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
        items={opciones(ACCIONES, (a) => ROTULO_GRUPO[a as AccionAfirmativa])}
        value={perfil.accionAfirmativa}
        onValueChange={(valor) =>
          onCambio({ ...perfil, accionAfirmativa: valor as AccionAfirmativa })
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

/**
 * Construye fórmulas anónimas. No hay ningún campo de identidad: una fórmula es
 * exclusivamente el par de atributos jurídicos con los que se postula.
 */
export function CreadorFormulas() {
  const crearFormula = useSimulador((s) => s.crearFormula)
  const [propietario, setPropietario] = useState<PerfilCandidato>(PERFIL_INICIAL)
  const [suplente, setSuplente] = useState<PerfilCandidato>(PERFIL_INICIAL)
  const [replicar, setReplicar] = useState(true)

  const suplenteEfectivo = replicar ? propietario : suplente
  const previa = { id: 'previa', propietario, suplente: suplenteEfectivo }
  const cuotas = cuotasAcreditadas(previa)

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        crearFormula(propietario, suplenteEfectivo)
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <CampoPerfil
          titulo="Persona propietaria"
          sujeto="persona propietaria"
          perfil={propietario}
          onCambio={setPropietario}
        />
        <CampoPerfil
          titulo="Persona suplente"
          sujeto="persona suplente"
          perfil={suplenteEfectivo}
          onCambio={setSuplente}
          deshabilitado={replicar}
        />
      </div>

      <label className="text-muted-foreground flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="accent-primary size-4"
          checked={replicar}
          onChange={(e) => {
            setReplicar(e.target.checked)
            if (!e.target.checked) setSuplente(propietario)
          }}
        />
        Suplencia con los mismos atributos
      </label>

      <p className="text-muted-foreground text-xs">
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

      <Button type="submit" className="w-full">
        <IconPlus data-icon="inline-start" />
        Agregar fórmula
      </Button>
    </form>
  )
}
