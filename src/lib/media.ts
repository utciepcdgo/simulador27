import { useSyncExternalStore } from 'react'

/** Umbral a partir del cual el arrastre es una interacción razonable. */
const ESCRITORIO = '(min-width: 768px)'

const consulta = () => window.matchMedia(ESCRITORIO)

function suscribir(avisar: () => void): () => void {
  const mq = consulta()
  mq.addEventListener('change', avisar)
  return () => mq.removeEventListener('change', avisar)
}

/**
 * Si el drag & drop debe estar activo. En pantallas angostas el motor se apaga y
 * la asignación se hace con menús desplegables, que es lo que el brief §5 pide
 * para móvil.
 */
export function useEsEscritorio(): boolean {
  return useSyncExternalStore(
    suscribir,
    () => consulta().matches,
    () => true,
  )
}
