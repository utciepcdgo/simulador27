// ARCHIVO GENERADO — no editar a mano.
// Fuente: data/sirc-bloques-diputaciones-PEL-2026-2027.csv
// Regenerar con: pnpm catalogo:generar
// Registro: data/partidos-PEL-2026-2027.csv

/**
 * Partidos con registro vigente, en el orden en que lo obtuvieron.
 *
 * El `id_partido` **es** ese orden de registro, y es la identidad del partido en
 * todo el sistema. Las siglas son una etiqueta para mostrar, no una llave: pueden
 * cambiar sin que cambie el partido.
 *
 * Ojo: el id NO coincide con el que trae el CSV de votación del PEL 2023-2024.
 * El cruce entre ambas fuentes se hace por siglas.
 */
export const PARTIDOS = [
  { id_partido: 1, siglas: 'PAN', nombre: "Partido Acción Nacional" },
  { id_partido: 2, siglas: 'PRI', nombre: "Partido Revolucionario Institucional" },
  { id_partido: 3, siglas: 'PVEM', nombre: "Partido Verde Ecologista de México" },
  { id_partido: 4, siglas: 'PT', nombre: "Partido del Trabajo" },
  { id_partido: 5, siglas: 'MC', nombre: "Movimiento Ciudadano" },
  { id_partido: 6, siglas: 'MORENA', nombre: "morena" },
  { id_partido: 7, siglas: 'PESD', nombre: "Partido Encuentro Solidario Durango" },
  { id_partido: 8, siglas: 'PV', nombre: "Partido Villista" },
  { id_partido: 9, siglas: 'PER', nombre: "Partido Estatal Renovación" },
  { id_partido: 10, siglas: 'PAZ', nombre: "Partido PAZ" },
  { id_partido: 11, siglas: 'SOMOSMX', nombre: "Somos México" },
] as const

/** Atajo legible: `PARTIDO.MORENA` en vez de un 6 suelto. */
export const PARTIDO = {
  PAN: 1,
  PRI: 2,
  PVEM: 3,
  PT: 4,
  MC: 5,
  MORENA: 6,
  PESD: 7,
  PV: 8,
  PER: 9,
  PAZ: 10,
  SOMOSMX: 11,
} as const

export type IdPartido = (typeof PARTIDOS)[number]['id_partido']
export type Partido = (typeof PARTIDOS)[number]

const POR_ID = new Map<number, Partido>(PARTIDOS.map((p) => [p.id_partido, p]))

export function partidoDe(id: IdPartido): Partido {
  const partido = POR_ID.get(id)
  if (!partido) throw new Error(`Partido ${id} ausente del registro`)
  return partido
}

/** Siglas para mostrar. Todo rótulo pasa por aquí; el id nunca se imprime. */
export function siglasDe(id: IdPartido): string {
  return partidoDe(id).siglas
}

export function nombreDe(id: IdPartido): string {
  return partidoDe(id).nombre
}

/** Emblema oficial. El archivo se llama como las siglas. */
export function emblemaDe(id: IdPartido): string {
  return `https://s3.us-east-1.amazonaws.com/static.appsiepcdurango.mx/emblemas/${siglasDe(id)}.svg`
}
