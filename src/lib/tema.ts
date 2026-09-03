import { useCallback, useEffect, useState } from 'react'

export type Tema = 'sistema' | 'claro' | 'oscuro'

/**
 * Clave de `localStorage`.
 *
 * OJO: está duplicada en el script en línea de `index.html`, que aplica el tema
 * antes del primer pintado para evitar el parpadeo. Si cambia aquí, cambia allá.
 */
export const CLAVE_TEMA = 'simulador27:tema'

const TEMAS: readonly Tema[] = ['sistema', 'claro', 'oscuro']

function consultaOscuro(): MediaQueryList {
  return window.matchMedia('(prefers-color-scheme: dark)')
}

function leerGuardado(): Tema {
  try {
    const guardado = localStorage.getItem(CLAVE_TEMA)
    return TEMAS.includes(guardado as Tema) ? (guardado as Tema) : 'sistema'
  } catch {
    // Modo privado o almacenamiento bloqueado: el tema deja de persistir, pero
    // la aplicación sigue funcionando con la preferencia del sistema.
    return 'sistema'
  }
}

function esOscuro(tema: Tema): boolean {
  return tema === 'sistema' ? consultaOscuro().matches : tema === 'oscuro'
}

/**
 * El `.dark` va en `<html>` porque el variante de Tailwind es `&:is(.dark *)`:
 * exige que el elemento sea descendiente, y solo la raíz lo cubre todo.
 * `color-scheme` acompaña para que las barras de scroll y los controles nativos
 * del navegador cambien con el resto.
 */
function aplicar(oscuro: boolean): void {
  document.documentElement.classList.toggle('dark', oscuro)
  document.documentElement.style.colorScheme = oscuro ? 'dark' : 'light'
}

export function useTema(): [Tema, (tema: Tema) => void] {
  const [tema, setTema] = useState<Tema>(leerGuardado)

  useEffect(() => {
    aplicar(esOscuro(tema))
    // En 'sistema' hay que seguir escuchando: la preferencia puede cambiar con
    // la app abierta, por horario o por ajuste del sistema operativo.
    if (tema !== 'sistema') return
    const consulta = consultaOscuro()
    const alCambiar = () => aplicar(consulta.matches)
    consulta.addEventListener('change', alCambiar)
    return () => consulta.removeEventListener('change', alCambiar)
  }, [tema])

  const elegir = useCallback((siguiente: Tema) => {
    try {
      localStorage.setItem(CLAVE_TEMA, siguiente)
    } catch {
      // Sin persistencia, pero el cambio sí surte efecto en esta sesión.
    }
    setTema(siguiente)
  }, [])

  return [tema, elegir]
}
