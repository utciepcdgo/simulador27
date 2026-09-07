import { pdf } from '@react-pdf/renderer'
import { createElement } from 'react'
import type { Criterios } from '../domain/reglas'
import type { EstadoSimulacion } from '../domain/types'
import { Dictamen } from './Dictamen'
import { armarDossier, puedeImprimirse } from './dossier'
import { cargarRecursos } from './recursos'

export { puedeImprimirse } from './dossier'

/**
 * El producto final: el resultado de la simulación en papel.
 *
 * Todo este módulo —la composición, la tipografía y los cuatrocientos y pico
 * kilobytes de `react-pdf`— se carga en diferido desde el botón que lo invoca,
 * así que no pesa sobre el arranque de quien nunca genera el documento.
 */
export async function generarDictamen(
  estado: EstadoSimulacion,
  criterios: Criterios,
): Promise<Blob> {
  if (!puedeImprimirse(estado, criterios)) {
    throw new Error('La simulación todavía no cumple todas las reglas')
  }
  const recursos = await cargarRecursos(estado.postulante.integrantes)
  const dossier = armarDossier(estado, criterios)
  const documento = createElement(Dictamen, { dossier, recursos })
  return pdf(documento as Parameters<typeof pdf>[0]).toBlob()
}

/** Nombre del archivo: quién postula y cuándo, para que dos no se pisen. */
export function nombreArchivo(estado: EstadoSimulacion, momento = new Date()): string {
  const siglas = estado.postulante.integrantes.length === 1 ? 'individual' : 'coalicion'
  const sello = momento.toISOString().slice(0, 16).replace(/[:T]/g, '-')
  return `simulacion-postulaciones-${siglas}-${sello}.pdf`
}

export async function descargarDictamen(
  estado: EstadoSimulacion,
  criterios: Criterios,
): Promise<void> {
  const blob = await generarDictamen(estado, criterios)
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombreArchivo(estado)
  enlace.click()
  // El objeto se libera después del clic, no antes: revocarlo de inmediato deja
  // al navegador sin nada que descargar.
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
