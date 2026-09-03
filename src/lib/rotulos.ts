import type { Grupo } from '../domain/reglas'
import type { Genero } from '../domain/types'

/**
 * Rótulos normativos de los valores que el dominio maneja con llaves cortas.
 *
 * El dominio guarda `'Indígena'` o `'No Binario'` porque son identificadores
 * estables sobre los que se apoyan el motor, las pruebas y el estado
 * persistido. La norma, en cambio, nombra a las personas primero y en plural
 * —artículos 5 y 56 de los Lineamientos—, y ese es el texto que debe llegar a
 * la pantalla.
 *
 * Traducir aquí, y no renombrar el tipo, mantiene una sola versión de cada
 * rótulo revisable por el área jurídica sin tocar el motor. Los mensajes que el
 * propio dominio redacta ya llevan la forma normativa escrita en su lugar.
 */
export const ROTULO_GENERO: Record<Genero, string> = {
  Mujer: 'Mujer',
  Hombre: 'Hombre',
  // Artículo 56.1 de los Lineamientos.
  'No Binario': 'No binaria',
}

/**
 * Rótulos de las medidas compensatorias, más `Ninguna` para el selector.
 *
 * `Grupo | 'Ninguna'` cubre exactamente la unión de `Grupo` —que añade la
 * juventud— y de `AccionAfirmativa`, así que el mapa sirve a los tres lugares
 * que lo necesitan sin duplicarse: el constructor de fórmulas, la ficha y la
 * tabla del balance.
 */
export const ROTULO_GRUPO: Record<Grupo | 'Ninguna', string> = {
  Ninguna: 'Sin medida compensatoria',
  Joven: 'Joven',
  Indígena: 'Indígena',
  Discapacidad: 'Discapacidad permanente',
  'Diversidad Sexual': 'Diversidad sexual',
  'Adulto Mayor': 'Adultos mayores',
  Migrante: 'Migrantes',
}
