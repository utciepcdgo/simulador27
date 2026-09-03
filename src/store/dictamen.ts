import { useMemo } from 'react'
import { esCerrable, evaluarSimulacion, porCompletar, requierenSustitucion } from '../domain/reglas'
import type { ResultadoRegla } from '../domain/types'
import type { Criterios } from '../domain/reglas'
import { useCriterios } from './configuracion'
import { estadoDe, useSimulador } from './simulador'

export interface Dictamen {
  resultados: ResultadoRegla[]
  /** Lo colocado contradice el requisito: se repara reemplazando una fórmula. */
  sustituciones: ResultadoRegla[]
  /** Solo falta terminar de asignar. */
  porCompletar: ResultadoRegla[]
  cerrable: boolean
  /** Con qué lectura se calculó. Lo necesita la insignia del panel. */
  criterios: Criterios
}

/**
 * El dictamen es derivado, nunca estado: se recalcula de las tres piezas que lo
 * determinan y no puede quedar desincronizado de ellas.
 */
export function useDictamen(): Dictamen | null {
  const postulante = useSimulador((s) => s.postulante)
  const distritos = useSimulador((s) => s.distritos)
  const listasRP = useSimulador((s) => s.listasRP)
  const criterios = useCriterios()
  return useMemo(() => {
    const estado = estadoDe({ postulante, distritos, listasRP })
    if (!estado) return null
    const resultados = evaluarSimulacion(estado, criterios)
    return {
      resultados,
      sustituciones: requierenSustitucion(resultados),
      porCompletar: porCompletar(resultados),
      cerrable: esCerrable(resultados),
      criterios,
    }
  }, [postulante, distritos, listasRP, criterios])
}
