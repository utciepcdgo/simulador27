import { useCallback, useEffect, useState } from 'react'

export type TamanoTexto = 'sistema' | 'pequeno' | 'mediano' | 'grande'

/**
 * Clave de `localStorage`.
 *
 * OJO: está duplicada en el script en línea de `index.html`, que aplica el
 * tamaño antes del primer pintado. Si cambia aquí, cambia allá.
 */
export const CLAVE_TEXTO = 'simulador27:texto'

/**
 * La escala, en porcentaje del tamaño base del navegador.
 *
 * **Porcentaje y no píxeles**, y esa es la decisión que hace accesible a esta
 * opción. Quien necesita leer más grande casi siempre ya lo configuró en su
 * navegador o en su sistema operativo; fijar aquí un `18px` le *reduciría* el
 * texto si su base son 24. En porcentaje, «Grande» es una cuarta parte más de lo
 * que esa persona ya eligió, sea lo que sea.
 *
 * Por eso `sistema` no tiene valor: no escribe nada en la raíz y deja que mande
 * el navegador. Es la opción de origen, como en el tema.
 */
const ESCALA: Record<Exclude<TamanoTexto, 'sistema'>, string> = {
  pequeno: '87.5%',
  mediano: '100%',
  grande: '125%',
}

const TAMANOS: readonly TamanoTexto[] = ['sistema', 'pequeno', 'mediano', 'grande']

function leerGuardado(): TamanoTexto {
  try {
    const guardado = localStorage.getItem(CLAVE_TEXTO)
    return TAMANOS.includes(guardado as TamanoTexto) ? (guardado as TamanoTexto) : 'sistema'
  } catch {
    // Modo privado o almacenamiento bloqueado: deja de persistir, pero la
    // aplicación sigue funcionando con el tamaño del navegador.
    return 'sistema'
  }
}

/**
 * Todo lo que la interfaz mide está en `rem` —el texto, los iconos, los huecos y
 * los anchos—, así que basta con mover la raíz para que la página entera crezca
 * en proporción en vez de descuadrarse.
 */
function aplicar(tamano: TamanoTexto): void {
  const raiz = document.documentElement
  if (tamano === 'sistema') raiz.style.removeProperty('font-size')
  else raiz.style.fontSize = ESCALA[tamano]
}

export function useTamanoTexto(): [TamanoTexto, (tamano: TamanoTexto) => void] {
  const [tamano, setTamano] = useState<TamanoTexto>(leerGuardado)

  useEffect(() => {
    aplicar(tamano)
  }, [tamano])

  const elegir = useCallback((siguiente: TamanoTexto) => {
    try {
      localStorage.setItem(CLAVE_TEXTO, siguiente)
    } catch {
      // Sin persistencia, pero el cambio sí surte efecto en esta sesión.
    }
    setTamano(siguiente)
  }, [])

  return [tamano, elegir]
}
