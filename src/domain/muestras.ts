import { homogeneidadGenero } from './reglas/token'
import type { AccionAfirmativa, Genero, PerfilCandidato } from './types'

const GENEROS: readonly Genero[] = ['Mujer', 'Hombre', 'No Binario']

function perfil(genero: Genero): PerfilCandidato {
  return { genero, esJoven: false, accionAfirmativa: 'Ninguna' }
}

/**
 * Las parejas de género que el artículo 53 admite.
 *
 * **Se derivan de la regla, no se enumeran.** Escribir la lista a mano —M-M,
 * H-M, H-H, H-NB, NB-M, NB-H, NB-NB— habría duplicado lo que
 * `homogeneidadGenero` ya sabe, y el día que la regla cambiara la lista se
 * quedaría atrás sin que nada avisara. Preguntándole a la propia regla, el
 * generador no puede producir una fórmula que el motor rechace.
 */
const PAREJAS: readonly (readonly [Genero, Genero])[] = GENEROS.flatMap((propietario) =>
  GENEROS.map((suplente) => [propietario, suplente] as const),
).filter(([propietario, suplente]) =>
  homogeneidadGenero({
    id: 'sonda',
    propietario: perfil(propietario),
    suplente: perfil(suplente),
  }).cumple,
)

/**
 * Medidas de las que se sortea, con «Ninguna» repetida para que salga más a
 * menudo: en un lote realista la mayoría de las fórmulas no lleva ninguna.
 */
const MEDIDAS: readonly AccionAfirmativa[] = [
  'Ninguna',
  'Ninguna',
  'Ninguna',
  'Ninguna',
  'Indígena',
  'Discapacidad',
  'Diversidad Sexual',
  'Adulto Mayor',
  'Migrante',
]

function alAzar<T>(opciones: readonly T[]): T {
  return opciones[Math.floor(Math.random() * opciones.length)]
}

/**
 * Un par de perfiles al azar, siempre válido.
 *
 * **La medida y la edad se sortean por fórmula y se aplican a los dos
 * integrantes**, no por persona. Un lote aleatorio es una herramienta y hacen
 * falta piezas usables: sorteando por separado, casi todas las fórmulas con
 * medida saldrían mixtas y no acreditarían nada. La fórmula mixta sigue siendo
 * válida —artículo 5 fracción XV: la homogeneidad ata a la que se postula *bajo*
 * la medida— y se construye a mano en el creador, que es donde tiene sentido
 * pensarla.
 */
export function perfilesAlAzar(): [PerfilCandidato, PerfilCandidato] {
  const [propietario, suplente] = alAzar(PAREJAS)
  const accionAfirmativa = alAzar(MEDIDAS)
  const esJoven = Math.random() < 0.2
  return [
    { genero: propietario, esJoven, accionAfirmativa },
    { genero: suplente, esJoven, accionAfirmativa },
  ]
}

/**
 * Un par de perfiles con el género que el reparto pide.
 *
 * `Hombre` a secas y no una tirada entre hombre y no binario: el reparto razona
 * en género para paridad, donde las candidaturas no binarias ocupan lugares del
 * masculino, y meterlas sin que nadie lo pida sería decidir por la persona
 * usuaria algo que la norma deja a su voluntad.
 */
export function perfilesPara(
  genero: 'Mujer' | 'Hombre',
  extras: Partial<PerfilCandidato> = {},
): [PerfilCandidato, PerfilCandidato] {
  const base: PerfilCandidato = { ...perfil(genero), ...extras }
  return [base, { ...base }]
}
