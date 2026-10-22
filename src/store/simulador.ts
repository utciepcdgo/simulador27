import { create } from 'zustand'
import { criteriosVigentes } from './configuracion'
import { ordenarPorRegistro, tableroInicial } from '../domain/catalogo'
import { esMujer } from '../domain/genero'
import { perfilesAlAzar, perfilesPara } from '../domain/muestras'
import {
  admiteEnDistrito,
  admiteEnListaRP,
  ambitosDe,
  ambitosRP,
  esFormulaJoven,
  formulaIndividualDe,
  formulasEnDistrito,
  POSICIONES_RP,
  repartoNecesario,
  validarFormula,
  type Ambito,
} from '../domain/reglas'
import type {
  DistritoActivo,
  EstadoSimulacion,
  GeneroParidad,
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
  /**
   * Saca del ámbito un distrito donde el partido no va a postular, o lo devuelve.
   *
   * Es el artículo 27: los bloques se integran con los distritos donde sí se
   * postula, así que quitar uno reordena el resto por porcentaje, vuelve a
   * repartirlos en tres y recalcula todo lo que se mide sobre ellos. El motor ya
   * lo hacía; lo único que faltaba era poder decírselo.
   */
  alternarPostulacion: (id_distrito: number) => void
  /**
   * Lo mismo, para un integrante en un distrito fuera del convenio.
   *
   * Ahí la decisión no es de la coalición sino de cada quien: en una coalición
   * parcial o flexible, los distritos que el convenio no abarca son justo donde
   * un partido puede optar por no contender. El tablero individual de ese
   * partido se rehace con los que le quedan; el de sus aliados no se entera.
   */
  alternarPostulacionIndividual: (id_distrito: number, partido: IdPartido) => void
  crearFormula: (propietario: PerfilCandidato, suplente: PerfilCandidato) => void
  /**
   * Cambia los atributos de una fórmula sin moverla de donde está.
   *
   * Devuelve la regla que lo impide, o `null` si el cambio se aplicó. No enciende
   * el rebote: quien edita está dentro de un formulario y ahí es donde tiene que
   * leer el motivo, junto al campo que lo provocó. El `rechazo` global existe
   * para el arrastre, que no tiene dónde poner el mensaje.
   */
  modificarFormula: (
    id: string,
    propietario: PerfilCandidato,
    suplente: PerfilCandidato,
  ) => ResultadoRegla | null
  eliminarFormula: (id: string) => void
  /** `partido` es `null` cuando el distrito va en convenio. */
  asignarMR: (id: string, id_distrito: number, partido: IdPartido | null) => void
  asignarRP: (id: string, partido: IdPartido, posicion: number) => void
  devolverABandeja: (id: string) => void
  descartarRechazo: () => void

  // ── Llenado rápido ───────────────────────────────────────────────────────
  /** Añade a la bandeja `cuantas` fórmulas válidas al azar. */
  crearAlAzar: (cuantas: number) => void
  /**
   * Crea las fórmulas que le faltan al ámbito para poder cumplir.
   *
   * Cuenta lo que ya hay —en la bandeja y en el tablero— y solo completa el
   * déficit, de modo que pulsarlo dos veces no duplique el pozo.
   */
  crearNecesarias: (etiquetaAmbito: string) => number
  /** Coloca fórmulas de la bandeja en los distritos vacíos del ámbito. */
  distribuir: (etiquetaAmbito: string) => { colocadas: number; irresolubles: string[] }
  /** Devuelve a la bandeja todas las fórmulas de mayoría relativa. */
  vaciarTablero: () => number
  /**
   * Elimina las fórmulas de la bandeja. No las mueve: dejan de existir.
   *
   * Es la única de las cinco que no tiene vuelta atrás —las otras crean, o
   * devuelven al sitio del que salieron—. Lo colocado en el tablero y en la
   * Lista «A» no se toca: vaciar la bandeja es vaciar la bandeja.
   */
  vaciarBandeja: () => number
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
/** El ámbito de la pestaña activa, reproyectado desde el estado de ahora. */
function ambitoPorEtiqueta(s: Simulador, etiqueta: string): Ambito | undefined {
  const estado = estadoDe(s)
  if (!estado) return undefined
  return ambitosDe(estado, criteriosVigentes()).find(
    (a) => a.tipo === 'tablero' && a.etiqueta === etiqueta,
  )
}

function contiene(postulacion: Postulacion, id: string): boolean {
  return formulasEnDistrito(postulacion).some((f) => f.id === id)
}

function sinFormula(postulacion: Postulacion, id: string): Postulacion {
  if (postulacion.modo === 'convenio') {
    return postulacion.formula?.id === id ? { ...postulacion, formula: null } : postulacion
  }
  if (postulacion.modo === 'fuera') {
    // La negativa a postular se conserva: quitar una fórmula del distrito no
    // deshace la decisión de quien ya había declinado contender ahí.
    const formulas = Object.fromEntries(
      Object.entries(postulacion.formulas).filter(
        ([, decision]) => decision === 'sin-postular' || decision?.id !== id,
      ),
    )
    return { modo: 'fuera', formulas }
  }
  return postulacion
}

function localizar(s: Simulador, id: string): TokenFormula | null {
  const enBandeja = s.bandeja.find((f) => f.id === id)
  if (enBandeja) return enBandeja
  for (const distrito of s.distritos) {
    const encontrada = formulasEnDistrito(distrito.postulacion).find((f) => f.id === id)
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
    // El orden de selección en pantalla es irrelevante: manda el de registro.
    const postulante: Postulante = { integrantes: ordenarPorRegistro(integrantes), modalidad }
    // El tablero se rehace entero: al cambiar de postulante cambian los
    // porcentajes, y con ellos las posiciones de rentabilidad y los bloques.
    // Conservar las asignaciones las dejaría en distritos que ya no significan
    // lo mismo, así que las fórmulas regresan a la bandeja.
    const { distritos, listasRP, bandeja } = get()
    const asignadas = [
      ...distritos.flatMap((d) => formulasEnDistrito(d.postulacion)),
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
      const desalojadas = formulasEnDistrito(distrito.postulacion)
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

  alternarPostulacion: (id_distrito) =>
    set((s) => {
      const distrito = s.distritos.find((d) => d.id_distrito === id_distrito)
      // Solo para quien compite solo: en alianza, un distrito donde no se va a
      // postular sencillamente no se sigla.
      if (!distrito || s.postulante?.integrantes.length !== 1) return {}
      const partido = s.postulante.integrantes[0]
      // La fórmula que hubiera ahí vuelve a la bandeja: el distrito deja de
      // formar parte del ámbito y quedarse dentro no significaría nada.
      const desalojadas = formulasEnDistrito(distrito.postulacion)
      const postulacion: Postulacion =
        distrito.postulacion.modo === 'sin-postular'
          ? { modo: 'convenio', partido, formula: null }
          : { modo: 'sin-postular' }
      return {
        distritos: s.distritos.map((d) =>
          d.id_distrito === id_distrito ? { ...d, postulacion } : d,
        ),
        bandeja: [...s.bandeja, ...desalojadas],
      }
    }),

  alternarPostulacionIndividual: (id_distrito, partido) =>
    set((s) => {
      const distrito = s.distritos.find((d) => d.id_distrito === id_distrito)
      if (!distrito || distrito.postulacion.modo !== 'fuera') return {}
      const { formulas } = distrito.postulacion

      // Al declinar, la fórmula que hubiera puesta vuelve a la bandeja: el
      // distrito sale del ámbito del partido y quedarse dentro no diría nada.
      const desalojada = formulaIndividualDe(distrito.postulacion, partido)
      const siguiente = { ...formulas }
      if (formulas[partido] === 'sin-postular') delete siguiente[partido]
      else siguiente[partido] = 'sin-postular'

      return {
        distritos: s.distritos.map((d) =>
          d.id_distrito === id_distrito
            ? { ...d, postulacion: { modo: 'fuera', formulas: siguiente } }
            : d,
        ),
        bandeja: desalojada ? [...s.bandeja, desalojada] : s.bandeja,
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

modificarFormula: (id, propietario, suplente) => {
    const s = get()
    const actual = localizar(s, id)
    if (!actual) return null
    const formula: TokenFormula = { ...actual, propietario, suplente }

    // Las mismas tres puertas que atraviesa una fórmula al crearse y al soltarse,
    // en el mismo orden. Editar en su sitio no puede ser el camino corto hacia un
    // estado que el arrastre rechaza.
    const invalida = validarFormula(formula).find((r) => !r.cumple)
    if (invalida) return invalida

    const estado = estadoDe(s)
    if (estado) {
      const proyectado = ambitosDe(estado, criteriosVigentes())
        .filter((a) => a.tipo === 'tablero')
        .flatMap((a) => a.distritos)
        .find((d) => d.formula_asignada?.id === id)
      if (proyectado) {
        const rechazo = admiteEnDistrito(formula, proyectado, criteriosVigentes())
        if (rechazo) return rechazo
      }

      const lista = s.listasRP.find((l) => l.posiciones.some((f) => f?.id === id))
      if (lista) {
        const ambito = ambitosRP(estado, criteriosVigentes()).find(
          (a) => a.partido === lista.partido,
        )
        const posicion = lista.posiciones.findIndex((f) => f?.id === id) + 1
        if (ambito) {
          const rechazo = admiteEnListaRP(ambito, posicion, formula)
          if (rechazo) return rechazo
        }
      }
    }

    set({
      bandeja: s.bandeja.map((f) => (f.id === id ? formula : f)),
      distritos: s.distritos.map((d) => {
        const { postulacion } = d
        if (postulacion.modo === 'convenio') {
          return postulacion.formula?.id === id
            ? { ...d, postulacion: { ...postulacion, formula } }
            : d
        }
        if (postulacion.modo === 'fuera') {
          const dueno = (Object.keys(postulacion.formulas) as unknown[])
            .map((clave) => Number(clave) as IdPartido)
            .find((partido) => formulaIndividualDe(postulacion, partido)?.id === id)
          if (dueno === undefined) return d
          return {
            ...d,
            postulacion: {
              modo: 'fuera',
              formulas: { ...postulacion.formulas, [dueno]: formula },
            },
          }
        }
        return d
      }),
      listasRP: s.listasRP.map((l) => ({
        ...l,
        posiciones: l.posiciones.map((f) => (f?.id === id ? formula : f)),
      })),
    })
    return null
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
    const tablero = ambitosDe(estado, criteriosVigentes()).find((a) =>
      a.tipo === 'tablero' && (partido ? a.fuera && a.partido === partido : !a.fuera),
    )
    const proyectado = tablero?.distritos.find((d) => d.id_distrito === id_distrito)
    if (!proyectado) return

    const rechazo = admiteEnDistrito(formula, proyectado, criteriosVigentes())
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

  // ── Llenado rápido ─────────────────────────────────────────────────────────

  crearAlAzar: (cuantas) =>
    set((s) => ({
      bandeja: [
        ...s.bandeja,
        ...Array.from({ length: Math.max(0, cuantas) }, () => {
          const [propietario, suplente] = perfilesAlAzar()
          return { id: crypto.randomUUID(), propietario, suplente }
        }),
      ],
    })),

  crearNecesarias: (etiquetaAmbito) => {
    const s = get()
    const ambito = ambitoPorEtiqueta(s, etiquetaAmbito)
    if (!ambito) return 0
    const reparto = repartoNecesario(ambito)

    // Solo el déficit: lo que ya está en la bandeja sirve para el mismo tablero,
    // así que crear el conjunto entero cada vez llenaría el pozo de sobras.
    const enBandeja = { Mujer: 0, Hombre: 0 }
    for (const formula of s.bandeja) {
      enBandeja[esMujer(formula.propietario) ? 'Mujer' : 'Hombre'] += 1
    }
    const nuevas: TokenFormula[] = []
    for (const genero of ['Mujer', 'Hombre'] as const) {
      const faltan = reparto.faltan[genero] - enBandeja[genero]
      for (let i = 0; i < faltan; i += 1) {
        const [propietario, suplente] = perfilesPara(genero)
        nuevas.push({ id: crypto.randomUUID(), propietario, suplente })
      }
    }
    // La medida de personas jóvenes va sobre una de las que ya se van a crear,
    // no sobre una fórmula de más: el tablero tiene tantos huecos como distritos.
    if (reparto.faltaJoven && !s.bandeja.some(esFormulaJoven)) {
      const anfitriona = nuevas[nuevas.length - 1]
      if (anfitriona) {
        anfitriona.propietario = { ...anfitriona.propietario, esJoven: true }
        anfitriona.suplente = { ...anfitriona.suplente, esJoven: true }
      }
    }
    if (nuevas.length > 0) set({ bandeja: [...s.bandeja, ...nuevas] })
    return nuevas.length
  },

  distribuir: (etiquetaAmbito) => {
    const s = get()
    const ambito = ambitoPorEtiqueta(s, etiquetaAmbito)
    if (!ambito) return { colocadas: 0, irresolubles: [] }
    const reparto = repartoNecesario(ambito)
    const partido = ambito.fuera ? ambito.partido : null

    // La bandeja se consume por género: cada distrito toma la primera fórmula
    // disponible del que le toca. Si no queda ninguna, el distrito se salta.
    const libres: Record<GeneroParidad, TokenFormula[]> = { Mujer: [], Hombre: [] }
    for (const formula of s.bandeja) {
      libres[esMujer(formula.propietario) ? 'Mujer' : 'Hombre'].push(formula)
    }
    // La fórmula joven primero, para que no se quede sin distrito por azar.
    for (const grupo of Object.values(libres)) {
      grupo.sort((a, b) => Number(esFormulaJoven(b)) - Number(esFormulaJoven(a)))
    }

    // El reparto propone un género por distrito, pero eso no basta para saber si
    // la fórmula cabe: bajo la lectura de la ley, una posición de menor votación
    // no admite ninguna mujer, y una fórmula `H-M` encabeza como hombre y aun así
    // queda fuera. Así que se pregunta a la misma puerta que consulta el
    // arrastre, en vez de repetir aquí el criterio y arriesgarse a que discrepen.
    const criterios = criteriosVigentes()
    const porId = new Map(ambito.distritos.map((d) => [d.id_distrito, d]))
    const asignadas = new Map<number, TokenFormula>()
    for (const [id_distrito, genero] of reparto.porDistrito) {
      const destino = porId.get(id_distrito)
      const grupo = libres[genero]
      const i = destino
        ? grupo.findIndex((f) => !admiteEnDistrito(f, destino, criterios))
        : grupo.length > 0
          ? 0
          : -1
      if (i === -1) continue
      asignadas.set(id_distrito, grupo.splice(i, 1)[0])
    }
    if (asignadas.size === 0) return { colocadas: 0, irresolubles: reparto.irresolubles }

    const usadas = new Set([...asignadas.values()].map((f) => f.id))
    set({
      bandeja: s.bandeja.filter((f) => !usadas.has(f.id)),
      distritos: s.distritos.map((d) => {
        const formula = asignadas.get(d.id_distrito)
        if (!formula) return d
        if (partido) {
          if (d.postulacion.modo !== 'fuera') return d
          return {
            ...d,
            postulacion: {
              modo: 'fuera',
              formulas: { ...d.postulacion.formulas, [partido]: formula },
            },
          }
        }
        if (d.postulacion.modo !== 'convenio') return d
        return { ...d, postulacion: { ...d.postulacion, formula } }
      }),
    })
    return { colocadas: asignadas.size, irresolubles: reparto.irresolubles }
  },

  vaciarBandeja: () => {
    const cuantas = get().bandeja.length
    if (cuantas > 0) set({ bandeja: [] })
    return cuantas
  },

  vaciarTablero: () => {
    const s = get()
    const recuperadas = s.distritos.flatMap((d) => formulasEnDistrito(d.postulacion))
    if (recuperadas.length === 0) return 0
    set({
      bandeja: [...s.bandeja, ...recuperadas],
      distritos: s.distritos.map((d) => {
        if (d.postulacion.modo === 'convenio') {
          return { ...d, postulacion: { ...d.postulacion, formula: null } }
        }
        if (d.postulacion.modo === 'fuera') {
          // Solo se van las fórmulas. Vaciar el tablero no revive una postulación
          // que su partido había declinado.
          const formulas = Object.fromEntries(
            Object.entries(d.postulacion.formulas).filter(([, v]) => v === 'sin-postular'),
          )
          return { ...d, postulacion: { modo: 'fuera', formulas } }
        }
        return d
      }),
    })
    return recuperadas.length
  },

}))
