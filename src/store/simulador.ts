import { create } from 'zustand'
import { tableroInicial } from '../domain/catalogo'
import {
  admiteEnDistrito,
  admiteEnListaRP,
  ambitosDe,
  ambitosRP,
  POSICIONES_RP,
  validarFormula,
} from '../domain/reglas'
import type {
  DistritoActivo,
  EstadoSimulacion,
  IdPartido,
  ListaRP,
  PerfilCandidato,
  Postulacion,
  Postulante,
  ResultadoRegla,
  TokenFormula,
} from '../domain/types'

export type Fase = 'convenio' | 'mayoria' | 'proporcional'

/**
 * Destino de un distrito en la Fase 1: siglado a un partido del convenio, fuera
 * del convenio —cada integrante postula por su cuenta— o todavía sin decidir.
 */
export type DestinoSiglado = IdPartido | 'fuera' | 'sin-decidir'

interface Simulador {
  /**
   * `null` hasta que se elige quién postula.
   *
   * No hay partido por omisión a propósito: precargar uno sería una toma de
   * postura, y en materia electoral cualquier señal de preferencia se lee como
   * tal. El simulador no arranca hasta que la persona usuaria decide.
   */
  postulante: Postulante | null
  distritos: DistritoActivo[]
  listasRP: ListaRP[]
  /** Fórmulas creadas que todavía no ocupan ninguna posición. */
  bandeja: TokenFormula[]
  /** Regla que rechazó el último movimiento; alimenta el diálogo del rebote. */
  rechazo: ResultadoRegla | null

  configurar: (integrantes: readonly IdPartido[], modalidad: Postulante['modalidad']) => void
  reiniciarTablero: () => void
  siglar: (id_distrito: number, destino: DestinoSiglado) => void
  crearFormula: (propietario: PerfilCandidato, suplente: PerfilCandidato) => void
  eliminarFormula: (id: string) => void
  /** `partido` es `null` cuando el distrito va en convenio. */
  asignarMR: (id: string, id_distrito: number, partido: IdPartido | null) => void
  asignarRP: (id: string, partido: IdPartido, posicion: number) => void
  devolverABandeja: (id: string) => void
  descartarRechazo: () => void
}

function listasVacias(integrantes: readonly IdPartido[]): ListaRP[] {
  return integrantes.map((partido) => ({
    partido,
    posiciones: Array.from({ length: POSICIONES_RP }, () => null),
  }))
}

/** Vista del estado que consume el motor de reglas, o `null` si aún no hay postulante. */
export function estadoDe(
  s: Pick<Simulador, 'postulante' | 'distritos' | 'listasRP'>,
): EstadoSimulacion | null {
  if (!s.postulante) return null
  return { postulante: s.postulante, distritos: s.distritos, listasRP: s.listasRP }
}

/** Todas las fórmulas que un distrito tiene colocadas, sea cual sea su modo. */
function formulasDe(postulacion: Postulacion): TokenFormula[] {
  if (postulacion.modo === 'convenio') return postulacion.formula ? [postulacion.formula] : []
  if (postulacion.modo === 'fuera') {
    return Object.values(postulacion.formulas).filter((f): f is TokenFormula => Boolean(f))
  }
  return []
}

function contiene(postulacion: Postulacion, id: string): boolean {
  return formulasDe(postulacion).some((f) => f.id === id)
}

function sinFormula(postulacion: Postulacion, id: string): Postulacion {
  if (postulacion.modo === 'convenio') {
    return postulacion.formula?.id === id ? { ...postulacion, formula: null } : postulacion
  }
  if (postulacion.modo === 'fuera') {
    const formulas = Object.fromEntries(
      Object.entries(postulacion.formulas).filter(([, f]) => f?.id !== id),
    )
    return { modo: 'fuera', formulas }
  }
  return postulacion
}

function localizar(s: Simulador, id: string): TokenFormula | null {
  const enBandeja = s.bandeja.find((f) => f.id === id)
  if (enBandeja) return enBandeja
  for (const distrito of s.distritos) {
    const encontrada = formulasDe(distrito.postulacion).find((f) => f.id === id)
    if (encontrada) return encontrada
  }
  for (const lista of s.listasRP) {
    const encontrada = lista.posiciones.find((f) => f?.id === id)
    if (encontrada) return encontrada
  }
  return null
}

/**
 * Saca una fórmula de donde esté, sin colocarla en ningún lado. Nunca la
 * destruye: quien llama decide dónde va.
 */
function extraer(s: Simulador, id: string): Pick<Simulador, 'distritos' | 'listasRP' | 'bandeja'> {
  return {
    bandeja: s.bandeja.filter((f) => f.id !== id),
    distritos: s.distritos.map((d) =>
      contiene(d.postulacion, id) ? { ...d, postulacion: sinFormula(d.postulacion, id) } : d,
    ),
    listasRP: s.listasRP.map((l) => ({
      ...l,
      posiciones: l.posiciones.map((f) => (f?.id === id ? null : f)),
    })),
  }
}

export const useSimulador = create<Simulador>()((set, get) => ({
  postulante: null,
  distritos: [],
  listasRP: [],
  bandeja: [],
  rechazo: null,

  configurar: (integrantes, modalidad) => {
    const postulante: Postulante = { integrantes, modalidad }
    // El tablero se rehace entero: al cambiar de postulante cambian los
    // porcentajes, y con ellos las posiciones de rentabilidad y los bloques.
    // Conservar las asignaciones las dejaría en distritos que ya no significan
    // lo mismo, así que las fórmulas regresan a la bandeja.
    const { distritos, listasRP, bandeja } = get()
    const asignadas = [
      ...distritos.flatMap((d) => formulasDe(d.postulacion)),
      ...listasRP.flatMap((l) => l.posiciones.filter((f): f is TokenFormula => f !== null)),
    ]
    set({
      postulante,
      distritos: tableroInicial(postulante),
      listasRP: listasVacias(integrantes),
      bandeja: [...bandeja, ...asignadas],
      rechazo: null,
    })
  },

  reiniciarTablero: () => {
    const { postulante } = get()
    if (!postulante) return
    set({
      distritos: tableroInicial(postulante),
      listasRP: listasVacias(postulante.integrantes),
      bandeja: [],
      rechazo: null,
    })
  },

  siglar: (id_distrito, destino) =>
    set((s) => {
      const distrito = s.distritos.find((d) => d.id_distrito === id_distrito)
      if (!distrito) return {}
      // Cambiar de modo cambia quién postula, así que las fórmulas que había
      // dejan de tener sentido ahí y vuelven a la bandeja en lugar de perderse.
      const desalojadas = formulasDe(distrito.postulacion)
      const postulacion: Postulacion =
        destino === 'sin-decidir'
          ? { modo: 'sin-decidir' }
          : destino === 'fuera'
            ? { modo: 'fuera', formulas: {} }
            : { modo: 'convenio', partido: destino, formula: null }
      return {
        distritos: s.distritos.map((d) =>
          d.id_distrito === id_distrito ? { ...d, postulacion } : d,
        ),
        bandeja: [...s.bandeja, ...desalojadas],
      }
    }),

  crearFormula: (propietario, suplente) => {
    const formula: TokenFormula = { id: crypto.randomUUID(), propietario, suplente }
    const rechazo = validarFormula(formula).find((r) => !r.cumple)
    if (rechazo) {
      set({ rechazo })
      return
    }
    set((s) => ({ bandeja: [...s.bandeja, formula] }))
  },

  eliminarFormula: (id) => set((s) => extraer(s, id)),

  asignarMR: (id, id_distrito, partido) => {
    const s = get()
    const formula = localizar(s, id)
    const destino = s.distritos.find((d) => d.id_distrito === id_distrito)
    if (!formula || !destino) return

    // La competitividad depende del ámbito completo, no del distrito suelto: la
    // posición y el bloque salen de reintegrar el conjunto al que pertenece.
    const estado = estadoDe(s)
    if (!estado) return
    const tablero = ambitosDe(estado).find((a) =>
      a.tipo === 'tablero' && (partido ? a.fuera && a.partido === partido : !a.fuera),
    )
    const proyectado = tablero?.distritos.find((d) => d.id_distrito === id_distrito)
    if (!proyectado) return

    const rechazo = admiteEnDistrito(formula, proyectado)
    if (rechazo) {
      set({ rechazo })
      return
    }

    const desalojada = proyectado.formula_asignada
    const sin = extraer(s, id)
    set({
      ...sin,
      bandeja: desalojada && desalojada.id !== id ? [...sin.bandeja, desalojada] : sin.bandeja,
      distritos: sin.distritos.map((d) => {
        if (d.id_distrito !== id_distrito) return d
        if (partido) {
          if (d.postulacion.modo !== 'fuera') return d
          return {
            ...d,
            postulacion: { modo: 'fuera', formulas: { ...d.postulacion.formulas, [partido]: formula } },
          }
        }
        if (d.postulacion.modo !== 'convenio') return d
        return { ...d, postulacion: { ...d.postulacion, formula } }
      }),
    })
  },

  asignarRP: (id, partido, posicion) => {
    const s = get()
    const formula = localizar(s, id)
    const lista = s.listasRP.find((l) => l.partido === partido)
    if (!formula || !lista) return

    const estado = estadoDe(s)
    const ambito = estado
      ? ambitosRP(estado).find((a) => a.partido === partido)
      : undefined
    if (ambito) {
      const rechazo = admiteEnListaRP(ambito, posicion, formula)
      if (rechazo) {
        set({ rechazo })
        return
      }
    }

    const desalojada = lista.posiciones[posicion - 1]
    const sin = extraer(s, id)
    set({
      ...sin,
      bandeja: desalojada && desalojada.id !== id ? [...sin.bandeja, desalojada] : sin.bandeja,
      listasRP: sin.listasRP.map((l) =>
        l.partido === partido
          ? { ...l, posiciones: l.posiciones.map((f, i) => (i + 1 === posicion ? formula : f)) }
          : l,
      ),
    })
  },

  devolverABandeja: (id) => {
    const s = get()
    const formula = localizar(s, id)
    if (!formula || s.bandeja.some((f) => f.id === id)) return
    const sin = extraer(s, id)
    set({ ...sin, bandeja: [...sin.bandeja, formula] })
  },

  descartarRechazo: () => set({ rechazo: null }),
}))
