import { useState } from 'react'
import { IconPlus } from '@tabler/icons-react'
import type { PerfilCandidato } from '../domain/types'
import { cuotasAcreditadas, esViaOrdinaria, PERFIL_INICIAL } from '../lib/formula'
import { useSimulador } from '../store/simulador'
import { CampoPerfil } from './CampoPerfil'
import { Button } from './ui/button'

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
