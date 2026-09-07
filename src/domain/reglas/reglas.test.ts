import { describe, expect, it } from 'vitest'
import { coalicion, individual, PARTIDO, siglasDe, tableroInicial } from '../catalogo'
import type {
  DistritoActivo,
  DistritoEvaluado,
  EstadoSimulacion,
  Genero,
  IdPartido,
  ListaRP,
  PerfilCandidato,
  Postulante,
  ResultadoRegla,
  TokenFormula,
} from '../types'
import {
  accionAfirmativaAcreditada,
  CRITERIOS_LEY,
  criteriosFueraDeLey,
  accionAfirmativaRP,
  acreditaInclusionRP,
  admiteEnDistrito,
  admiteEnListaRP,
  alternanciaRP,
  ambitosDe,
  ambitosRP,
  blindajeBaja,
  cuotaIndigena,
  cuotaJoven,
  encabezadoCompensatorioRP,
  esCerrable,
  declinaPostular,
  formulasEnDistrito,
  esFormulaJoven,
  evaluarMR,
  evaluarSimulacion,
  evaluarTokens,
  generoSubrepresentado,
  homogeneidadGenero,
  porCompletar,
  integracionDelConvenio,
  liderazgoBloque,
  mayoriaBloqueImpar,
  minimoJovenes,
  paridadBloques,
  paridadGeneral,
  requierenSustitucion,
  recontar,
  recuentoDe,
  repartoNecesario,
  umbralRegistroRP,
  validarFormula,
  type Ambito,
  type Reparto,
} from './index'

// ─── Constructores de escenario ─────────────────────────────────────────────

function perfil(genero: Genero, extras: Partial<PerfilCandidato> = {}): PerfilCandidato {
  return { genero, esJoven: false, accionAfirmativa: 'Ninguna', ...extras }
}

let contador = 0

/** Por omisión la suplencia replica a la persona propietaria: fórmula homogénea. */
function formula(propietario: PerfilCandidato, suplente = propietario): TokenFormula {
  contador += 1
  return { id: `t${contador}`, propietario, suplente }
}

const GENEROS: Record<string, Genero> = { M: 'Mujer', H: 'Hombre', N: 'No Binario' }

function porPatron(caracter: string): TokenFormula | null {
  if (caracter === '.') return null
  const genero = GENEROS[caracter]
  if (!genero) throw new Error(`Carácter de patrón desconocido: "${caracter}"`)
  return formula(perfil(genero))
}

/**
 * Tablero descrito por un patrón de 15 caracteres, uno por posición de
 * rentabilidad: `M` mujer, `H` hombre, `N` no binario, `.` sin asignar. Los
 * `ajustes` sustituyen la fórmula de una posición concreta.
 */
function tablero(
  patron: string,
  ajustes: Record<number, TokenFormula> = {},
  postulante: Postulante = individual(PARTIDO.PAN),
): DistritoActivo[] {
  const caracteres = patron.replace(/\s/g, '')
  if (caracteres.length !== 15) {
    throw new Error(`El patrón describe ${caracteres.length} posiciones, se esperaban 15`)
  }
  return tableroInicial(postulante).map((distrito, i) => ({
    ...distrito,
    postulacion: {
      modo: 'convenio',
      partido: postulante.integrantes[0],
      formula: ajustes[i + 1] ?? porPatron(caracteres[i]),
    },
  }))
}

/** Reparte el convenio por posición de rentabilidad: partido, o fuera de él. */
function repartir(
  distritos: DistritoActivo[],
  destino: (posicion: number) => IdPartido | 'fuera',
): DistritoActivo[] {
  return distritos.map((d) => {
    const elegido = destino(d.posicion_rentabilidad)
    const formula = d.postulacion.modo === 'convenio' ? d.postulacion.formula : null
    return {
      ...d,
      postulacion:
        elegido === 'fuera'
          ? { modo: 'fuera' as const, formulas: formula ? { [PARTIDO.PAN]: formula } : {} }
          : { modo: 'convenio' as const, partido: elegido, formula },
    }
  })
}

/** Los distritos proyectados como los ve la postulación conjunta. */
function evaluados(distritos: DistritoActivo[]): DistritoEvaluado[] {
  return [...ambitoDe(distritos).distritos]
}

function lista(
  partido: IdPartido,
  patron: string,
  ajustes: Record<number, TokenFormula> = {},
): ListaRP {
  const caracteres = patron.replace(/\s/g, '')
  if (caracteres.length !== 5) {
    throw new Error(`La lista describe ${caracteres.length} posiciones, se esperaban 5`)
  }
  return {
    partido,
    posiciones: [...caracteres].map((c, i) => ajustes[i + 1] ?? porPatron(c)),
  }
}

function simulacion(
  distritos: DistritoActivo[],
  listasRP: ListaRP[] = [],
  postulante: Postulante = individual(PARTIDO.PAN),
): EstadoSimulacion {
  return { postulante, distritos, listasRP }
}

/** El tablero de un partido que compite solo, tal como lo arma el motor. */
function ambitoDe(distritos: DistritoActivo[], postulante = individual(PARTIDO.PAN)): Ambito {
  const tablero = ambitosDe(simulacion(distritos, [], postulante)).find(
    (a) => a.tipo === 'tablero',
  )
  if (!tablero) throw new Error('No se produjo ningún tablero')
  return tablero
}

function regla(resultados: ResultadoRegla[], nombre: string): ResultadoRegla {
  const encontrada = resultados.find((r) => r.regla.startsWith(nombre))
  if (!encontrada) throw new Error(`No se emitió la regla "${nombre}"`)
  return encontrada
}

const INDIGENA = perfil('Hombre', { accionAfirmativa: 'Indígena' })
const JOVEN = perfil('Hombre', { esJoven: true })

/** Para PAN el Distrito XV cae en la posición 14. Ver docs/decisiones.md. */
const POSICION_XV_PAN = 14

function distritoEn(posicion: number): DistritoEvaluado {
  const distrito = evaluados(tablero('...............')).find(
    (d) => d.posicion_rentabilidad === posicion,
  )
  if (!distrito) throw new Error(`No hay distrito en la posición ${posicion}`)
  return distrito
}

// ─────────────────────────────────────────────────────────────────────────────
// Fórmulas
// ─────────────────────────────────────────────────────────────────────────────

describe('homogeneidad de género', () => {
  it('acepta la fórmula de mujer con suplencia mujer', () => {
    expect(homogeneidadGenero(formula(perfil('Mujer'))).cumple).toBe(true)
  })

  it('rechaza la fórmula de mujer con suplencia hombre', () => {
    const resultado = homogeneidadGenero(formula(perfil('Mujer'), perfil('Hombre')))
    expect(resultado.cumple).toBe(false)
    expect(resultado.gravedad).toBe('sustitucion')
  })

  it('rechaza la suplencia no binaria de una propietaria mujer, que para paridad cuenta como hombre', () => {
    expect(homogeneidadGenero(formula(perfil('Mujer'), perfil('No Binario'))).cumple).toBe(false)
  })

  it('deja libre la suplencia cuando la persona propietaria es hombre o no binaria', () => {
    expect(homogeneidadGenero(formula(perfil('Hombre'), perfil('Mujer'))).cumple).toBe(true)
    expect(homogeneidadGenero(formula(perfil('No Binario'), perfil('Hombre'))).cumple).toBe(true)
  })
})

describe('validez de la fórmula frente a acreditación de cuota', () => {
  it('admite la fórmula que combina grupos: es candidatura válida por la vía ordinaria', () => {
    const mixta = formula(INDIGENA, perfil('Hombre', { accionAfirmativa: 'Discapacidad' }))
    expect(validarFormula(mixta).every((r) => r.cumple)).toBe(true)
    expect(accionAfirmativaAcreditada(mixta)).toBeNull()
  })

  it('admite la suplencia sin adscripción de una propietaria indígena', () => {
    const conNinguna = formula(INDIGENA, perfil('Hombre'))
    expect(validarFormula(conNinguna).every((r) => r.cumple)).toBe(true)
    expect(accionAfirmativaAcreditada(conNinguna)).toBeNull()
  })

  it('solo el género invalida una fórmula', () => {
    const desigual = validarFormula(formula(perfil('Mujer'), perfil('Hombre')))
    expect(desigual).toHaveLength(1)
    expect(desigual[0].cumple).toBe(false)
    expect(validarFormula(formula(INDIGENA)).map((r) => r.regla)).toEqual([
      'Homogeneidad de género de la fórmula',
    ])
  })

  it('acredita la cuota solo cuando ambos integrantes comparten el grupo', () => {
    expect(accionAfirmativaAcreditada(formula(INDIGENA))).toBe('Indígena')
    expect(accionAfirmativaAcreditada(formula(INDIGENA, perfil('Hombre')))).toBeNull()
  })

  it('admite la fórmula con un solo integrante joven, que no acredita la cuota', () => {
    const media = formula(JOVEN, perfil('Hombre'))
    expect(validarFormula(media).every((r) => r.cumple)).toBe(true)
    expect(esFormulaJoven(media)).toBe(false)
    expect(esFormulaJoven(formula(JOVEN))).toBe(true)
  })

  it('no exige nada a la persona no binaria, que no declaró la cuota', () => {
    const noBinaria = formula(perfil('No Binario'), perfil('Hombre'))
    expect(validarFormula(noBinaria).every((r) => r.cumple)).toBe(true)
    expect(accionAfirmativaAcreditada(noBinaria)).toBeNull()
  })

  it('acredita diversidad sexual a la fórmula de dos personas no binarias sin declararla', () => {
    expect(accionAfirmativaAcreditada(formula(perfil('No Binario')))).toBe('Diversidad Sexual')
  })
})

describe('admisión en un distrito', () => {
  it('deja pasar cualquier fórmula a un distrito ordinario', () => {
    const mixta = formula(INDIGENA, perfil('Hombre', { accionAfirmativa: 'Discapacidad' }))
    expect(admiteEnDistrito(mixta, distritoEn(1))).toBeNull()
    expect(admiteEnDistrito(formula(perfil('Mujer')), distritoEn(1))).toBeNull()
  })

  it('rechaza fórmulas encabezadas por mujeres en la posición blindada', () => {
    const resultado = admiteEnDistrito(formula(perfil('Mujer')), distritoEn(15))
    expect(resultado?.gravedad).toBe('sustitucion')
    expect(resultado?.regla).toBe('Prohibición en distritos de menor porcentaje de votación')
    expect(admiteEnDistrito(formula(perfil('Mujer')), distritoEn(13))).toBeNull()
  })

  it('deja libre el tablero de dos distritos huérfanos, sin bloque Bajo', () => {
    const alianza = coalicion(PARTIDO.PRI, PARTIDO.PAN)
    // Trece distritos en convenio, dos fuera: el reparto 1-1-0 deja el bloque
    // Bajo vacío, así que ninguna posición queda blindada.
    const distritos = repartir(tablero('...............', {}, alianza), (p) =>
      p <= 13 ? PARTIDO.PRI : 'fuera',
    )
    const huerfanos = ambitosDe(simulacion(distritos, [], alianza)).find(
      (a) => a.etiqueta === 'PAN · postulaciones en lo individual',
    )!
    expect(huerfanos.distritos.map((d) => d.bloque)).toEqual(['Alta', 'Media'])
    expect(huerfanos.distritos.some((d) => d.esBlindada)).toBe(false)
    // Y por tanto admite una fórmula encabezada por mujer en cualquiera de las dos.
    for (const distrito of huerfanos.distritos) {
      expect(admiteEnDistrito(formula(perfil('Mujer')), distrito)).toBeNull()
    }
    expect(blindajeBaja(huerfanos).cumple).toBe(true)
    expect(blindajeBaja(huerfanos).mensaje).toContain('inoperante')
  })

  it('admite perfiles no binarios y hombres en la posición blindada', () => {
    expect(admiteEnDistrito(formula(perfil('No Binario')), distritoEn(15))).toBeNull()
    expect(admiteEnDistrito(formula(perfil('Hombre')), distritoEn(15))).toBeNull()
  })

  it('no reserva el Distrito XV: admite cualquier fórmula', () => {
    // Artículo 55.1: los partidos «procurarán» postular ahí una fórmula
    // integrada por personas indígenas, y el 55.2 la llama optativa. No es un
    // espacio reservado, así que el arrastre no puede rebotar por ese motivo.
    const xv = distritoEn(POSICION_XV_PAN)
    expect(xv.mayoria_indigena).toBe(true)
    const mixta = formula(INDIGENA, perfil('Hombre', { accionAfirmativa: 'Discapacidad' }))
    expect(admiteEnDistrito(mixta, xv)).toBeNull()
    expect(admiteEnDistrito(formula(INDIGENA), xv)).toBeNull()
    expect(admiteEnDistrito(formula(perfil('Hombre')), xv)).toBeNull()
  })

  it('en el Distrito XV solo queda en pie la prohibición del 28.2', () => {
    // Para PAN el Distrito XV cae en la posición 14. Lo único que ahí impide una
    // postulación es el género de quien encabeza, no la adscripción.
    const rechazo = admiteEnDistrito(formula(perfil('Mujer')), distritoEn(POSICION_XV_PAN))
    expect(rechazo?.regla).toBe('Prohibición en distritos de menor porcentaje de votación')
    const mujerIndigena = perfil('Mujer', { accionAfirmativa: 'Indígena' })
    expect(admiteEnDistrito(formula(mujerIndigena), distritoEn(POSICION_XV_PAN))?.regla).toBe(
      'Prohibición en distritos de menor porcentaje de votación',
    )
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Ámbitos
// ─────────────────────────────────────────────────────────────────────────────

describe('ámbitos de evaluación', () => {
  it('separa el tablero del registro para un partido que compite solo', () => {
    const ambitos = ambitosDe(simulacion(tablero('...............')))
    expect(ambitos.map((a) => `${a.etiqueta}|${a.tipo}`)).toEqual([
      'PAN · tablero|tablero',
      'PAN · paridad global|consolidado',
    ])
    expect(ambitos[0].distritos).toHaveLength(15)
  })

  it('ordena a los integrantes por registro, sea cual sea el orden de elección', () => {
    // Elegidos PRI, SOMOS y PAN en ese orden; deben salir PAN-PRI-SOMOS.
    // El `id_partido` es el orden de registro, así que ordenar por él reproduce
    // el orden oficial. Se normaliza al construir el postulante, de modo que el
    // emblema, el tinte del encabezado, las pestañas y las Listas "A" quedan
    // alineados sin que ninguno de ellos tenga que reordenar por su cuenta.
    const alianza = coalicion(PARTIDO.PRI, PARTIDO.SOMOS, PARTIDO.PAN)
    expect(alianza.integrantes).toEqual([PARTIDO.PAN, PARTIDO.PRI, PARTIDO.SOMOS])

    const ambitos = ambitosDe(
      simulacion(tablero('...............', {}, alianza), [], alianza),
    )
    expect(ambitos[0].etiqueta).toBe('Coalición PAN-PRI-SOMOS · convenio')
    expect(ambitos.filter((a) => a.tipo === 'consolidado').map((a) => a.etiqueta)).toEqual([
      'PAN · paridad global',
      'PRI · paridad global',
      'SOMOS · paridad global',
    ])
  })

  it('en coalición total produce el tablero del convenio y un registro por partido', () => {
    const alianza = coalicion(PARTIDO.PRI, PARTIDO.PAN)
    const distritos = repartir(tablero('...............', {}, alianza), (p) =>
      p % 2 === 1 ? PARTIDO.PRI : PARTIDO.PAN,
    )
    const ambitos = ambitosDe(simulacion(distritos, [], alianza))
    // Los integrantes salen en orden de registro —PAN es 1, PRI es 2— sin
    // importar en qué orden se hayan elegido al armar la coalición.
    expect(ambitos.map((a) => a.etiqueta)).toEqual([
      'Coalición PAN-PRI · convenio',
      'PAN · paridad global',
      'PRI · paridad global',
    ])
    expect(ambitos[0].distritos).toHaveLength(15)
    expect(ambitos[1].distritos).toHaveLength(7)
    expect(ambitos[2].distritos).toHaveLength(8)
  })

  it('en coalición parcial añade un tablero propio a cada integrante', () => {
    const alianza = coalicion(PARTIDO.PRI, PARTIDO.PAN)
    // Once distritos en convenio, cuatro fuera: coalición parcial.
    const distritos = repartir(tablero('...............', {}, alianza), (p) =>
      p > 11 ? 'fuera' : p % 2 === 1 ? PARTIDO.PRI : PARTIDO.PAN,
    )
    const ambitos = ambitosDe(simulacion(distritos, [], alianza))
    expect(ambitos.map((a) => a.etiqueta)).toEqual([
      'Coalición PAN-PRI · convenio',
      'PAN · postulaciones en lo individual',
      'PAN · paridad global',
      'PRI · postulaciones en lo individual',
      'PRI · paridad global',
    ])
    // Los cuatro distritos fuera del convenio aparecen una vez por integrante.
    expect(ambitos[1].distritos).toHaveLength(4)
    expect(ambitos[3].distritos).toHaveLength(4)
    // Y el registro de cada uno suma sus siglados más esos cuatro.
    expect(ambitos[2].distritos).toHaveLength(5 + 4)
    expect(ambitos[4].distritos).toHaveLength(6 + 4)
  })

  it('aísla los distritos huérfanos y les reintegra bloques propios', () => {
    const alianza = coalicion(PARTIDO.PRI, PARTIDO.PAN)
    // Ocho distritos en convenio, siete fuera: el caso del artículo 27.
    const distritos = repartir(tablero('...............', {}, alianza), (p) =>
      p <= 8 ? PARTIDO.PRI : 'fuera',
    )
    const ambitos = ambitosDe(simulacion(distritos, [], alianza))
    const huerfanos = ambitos.find((a) => a.etiqueta === 'PRI · postulaciones en lo individual')!

    expect(huerfanos.distritos).toHaveLength(7)
    // Renumerados del 1 al 7, no en las posiciones 9 a 15 del ranking de quince.
    expect(huerfanos.distritos.map((d) => d.posicion_rentabilidad)).toEqual([1, 2, 3, 4, 5, 6, 7])
    const cuenta = (bloque: string) => huerfanos.distritos.filter((d) => d.bloque === bloque).length
    expect([cuenta('Alta'), cuenta('Media'), cuenta('Baja')]).toEqual([3, 2, 2])
    // Y el blindaje se corre a las dos últimas de este tablero.
    expect(
      huerfanos.distritos.filter((d) => d.esBlindada).map((d) => d.posicion_rentabilidad),
    ).toEqual([6, 7])
  })

  it('reintegra también el tablero del convenio cuando la coalición es parcial', () => {
    const alianza = coalicion(PARTIDO.PRI, PARTIDO.PAN)
    const distritos = repartir(tablero('...............', {}, alianza), (p) =>
      p <= 8 ? PARTIDO.PRI : 'fuera',
    )
    const convenio = ambitosDe(simulacion(distritos, [], alianza))[0]
    expect(convenio.distritos.map((d) => d.posicion_rentabilidad)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    const cuenta = (bloque: string) => convenio.distritos.filter((d) => d.bloque === bloque).length
    expect([cuenta('Alta'), cuenta('Media'), cuenta('Baja')]).toEqual([3, 3, 2])
  })

  it('da a cada partido su propia competitividad fuera del convenio', () => {
    const alianza = coalicion(PARTIDO.PRI, PARTIDO.PAN)
    const distritos = repartir(tablero('...............', {}, alianza), () => 'fuera')
    const ambitos = ambitosDe(simulacion(distritos, [], alianza))
    const pri = ambitos.find((a) => a.etiqueta === 'PRI · postulaciones en lo individual')!
    const pan = ambitos.find((a) => a.etiqueta === 'PAN · postulaciones en lo individual')!
    const posicionDe = (ambito: Ambito, id: number) =>
      ambito.distritos.find((d) => d.id_distrito === id)!.posicion_rentabilidad
    // El Distrito XV es el más rentable para el PRI y de los peores para el PAN.
    expect(posicionDe(pri, 15)).toBe(1)
    expect(posicionDe(pan, 15)).toBe(14)
  })

  it('reparte las reglas: los bloques al tablero y los conteos al registro', () => {
    const ambitos = ambitosDe(simulacion(tablero('...............')))
    const tableroPAN = ambitos.find((a) => a.tipo === 'tablero')!
    const registroPAN = ambitos.find((a) => a.tipo === 'consolidado')!
    expect(evaluarMR(tableroPAN).map((r) => r.regla)).toEqual([
      'Paridad del bloque Alta',
      'Paridad del bloque Media',
      'Paridad del bloque Baja',
      'Mayoría de fórmulas encabezadas por mujeres en bloques impares',
      'Bloque encabezado por fórmula integrada por mujeres',
      'Prohibición en distritos de menor porcentaje de votación',
      'Medida compensatoria de personas jóvenes',
      'Medida compensatoria de personas indígenas',
    ])
    // La cuota joven no está aquí: su sujeto obligado es la coalición, no el
    // partido, así que vive en el tablero.
    expect(evaluarMR(registroPAN).map((r) => r.regla)).toEqual(['Paridad general de MR'])
  })

  it('retira el liderazgo de bloque en un tablero parcial, no la mayoría impar', () => {
    const alianza = coalicion(PARTIDO.PRI, PARTIDO.PAN)
    const distritos = repartir(tablero('...............', {}, alianza), (p) =>
      p <= 13 ? PARTIDO.PRI : 'fuera',
    )
    const ambitos = ambitosDe(simulacion(distritos, [], alianza))
    const convenio = ambitos[0]
    const huerfanos = ambitos.find((a) => a.etiqueta === 'PAN · postulaciones en lo individual')!

    // El artículo 28.1 solo corre con los quince distritos del Estado; el 28.4 y
    // el 28.5 no están condicionados y corren en todos los tableros.
    expect(convenio.distritos).toHaveLength(13)
    for (const parcial of [convenio, huerfanos]) {
      const reglas = evaluarMR(parcial).map((r) => r.regla)
      expect(reglas).toContain('Mayoría de fórmulas encabezadas por mujeres en bloques impares')
      expect(reglas).not.toContain('Bloque encabezado por fórmula integrada por mujeres')
    }
  })

  it('arrastra el siglado al proyectar, y lo deja nulo fuera del convenio', () => {
    const alianza = coalicion(PARTIDO.PRI, PARTIDO.PAN)
    const distritos = repartir(tablero('...............', {}, alianza), (p) =>
      p > 12 ? 'fuera' : p % 2 === 1 ? PARTIDO.PRI : PARTIDO.PAN,
    )
    const ambitos = ambitosDe(simulacion(distritos, [], alianza))
    const convenio = ambitos[0]
    expect(
      convenio.distritos.map((d) => [d.posicion_rentabilidad, d.siglado]),
    ).toEqual([
      [1, PARTIDO.PRI],
      [2, PARTIDO.PAN],
      [3, PARTIDO.PRI],
      [4, PARTIDO.PAN],
      [5, PARTIDO.PRI],
      [6, PARTIDO.PAN],
      [7, PARTIDO.PRI],
      [8, PARTIDO.PAN],
      [9, PARTIDO.PRI],
      [10, PARTIDO.PAN],
      [11, PARTIDO.PRI],
      [12, PARTIDO.PAN],
    ])

    // Fuera del convenio no hay nada que siglar: cada integrante postula por su
    // cuenta, y el tablero individual lo dice por sí mismo.
    const propio = ambitos.find((a) => a.etiqueta === 'PRI · postulaciones en lo individual')!
    expect(propio.distritos.every((d) => d.siglado === null)).toBe(true)
  })
})

describe('integración del convenio', () => {
  const alianza = coalicion(PARTIDO.PRI, PARTIDO.PAN)

  it('no aplica a quien compite solo', () => {
    expect(integracionDelConvenio(simulacion(tablero('...............')))).toBeNull()
  })

  it('es pendiente mientras queden distritos sin decidir', () => {
    // `tableroInicial` de una alianza nace sin decidir: repartirlo es la Fase 1.
    const estado = simulacion(tableroInicial(alianza), [], alianza)
    expect(integracionDelConvenio(estado)?.gravedad).toBe('por-completar')
    expect(integracionDelConvenio(estado)?.mensaje).toContain('Faltan 15')
  })

  it('clasifica el convenio según cuántos distritos abarca', () => {
    const clase = (limite: number) => {
      const distritos = repartir(tablero('...............', {}, alianza), (p) =>
        p <= limite ? PARTIDO.PRI : 'fuera',
      )
      return integracionDelConvenio(simulacion(distritos, [], alianza))
    }
    expect(clase(15)?.mensaje).toContain('Total')
    expect(clase(8)?.mensaje).toContain('Parcial')
    expect(clase(4)?.mensaje).toContain('Flexible')
    expect(clase(3)?.gravedad).toBe('sustitucion')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Mayoría relativa
// ─────────────────────────────────────────────────────────────────────────────

describe('paridad general', () => {
  it('cumple con ocho de quince fórmulas encabezadas por mujeres', () => {
    expect(paridadGeneral(ambitoDe(tablero('MMMHH MMMHH MMHHH'))).cumple).toBe(true)
  })

  it('es pendiente mientras el faltante siga cabiendo en los distritos vacíos', () => {
    const resultado = paridadGeneral(ambitoDe(tablero('MMMHH MMMHH .....')))
    expect(resultado.cumple).toBe(false)
    expect(resultado.gravedad).toBe('por-completar')
  })

  it('sigue siendo subsanable con el tablero lleno: la vía es sustituir', () => {
    // Siete mujeres y ocho hombres en los quince distritos. El mínimo de ocho no
    // está cumplido, pero la ley no lo tiene por irreparable: obliga al Instituto
    // a fijar plazo para sustituir antes de cancelar nada.
    const resultado = paridadGeneral(ambitoDe(tablero('MMMHH MMMHH MHHHH')))
    expect(resultado.cumple).toBe(false)
    expect(resultado.gravedad).toBe('sustitucion')
    expect(resultado.mensaje).toContain('hay 7 fórmulas de mujeres y 8 de hombres')
    expect(resultado.mensaje).toContain('sustituir')
  })

  it('avisa de que llenar los huecos no bastará, antes de que se acaben', () => {
    // Diez distritos ocupados por hombres y cinco vacíos: aunque los cinco se
    // llenen con mujeres, cinco no llega a ocho.
    const resultado = paridadGeneral(ambitoDe(tablero('HHHHH HHHHH .....')))
    expect(resultado.gravedad).toBe('sustitucion')
    expect(resultado.mensaje).toContain('no bastan')
  })

  it('la gravedad nombra la vía de reparación, no la gravedad del hecho', () => {
    // Con hueco suficiente basta asignar; sin él, hay que reemplazar. Ninguno de
    // los dos casos es irreparable, y el tipo ya no tiene cómo decir que lo sea.
    const conHueco = ['MMMHH MMMHH ..HHH', 'MMMHH MM... .....']
    const sinRemedioPorAsignar = ['HHHHH HHHHH HHHHH', 'MMMHH MMMHH MHHHH', 'HHHHH HHHHH .....']
    for (const patron of conHueco) {
      expect(paridadGeneral(ambitoDe(tablero(patron))).gravedad).toBe('por-completar')
    }
    for (const patron of sinRemedioPorAsignar) {
      expect(paridadGeneral(ambitoDe(tablero(patron))).gravedad).toBe('sustitucion')
    }
  })

  it('concuerda el singular cuando hay una sola fórmula de mujeres', () => {
    const resultado = paridadGeneral(ambitoDe(tablero('MHHHH HHHHH HHHHH')))
    expect(resultado.mensaje).toContain('hay 1 fórmula de mujeres y 14 de hombres')
  })

  it('mide el mínimo sobre el registro del partido, no sobre los quince', () => {
    const alianza = coalicion(PARTIDO.PRI, PARTIDO.PAN)
    const distritos = repartir(tablero('MMHHH HHHHH HHHHH', {}, alianza), (p) =>
      p <= 4 ? PARTIDO.PRI : PARTIDO.PAN,
    )
    const pri = ambitosDe(simulacion(distritos, [], alianza)).find(
      (a) => a.tipo === 'consolidado' && a.partido === PARTIDO.PRI,
    )!
    expect(paridadGeneral(pri).mensaje).toContain('2 de 4')
    expect(paridadGeneral(pri).cumple).toBe(true)
  })

  it('exige la mayoría femenina cuando el universo es impar', () => {
    const alianza = coalicion(PARTIDO.PRI, PARTIDO.PAN)
    // Trece distritos en convenio: 13 es impar, así que el mínimo es 7.
    const distritos = repartir(tablero('...............', {}, alianza), (p) =>
      p <= 13 ? PARTIDO.PRI : 'fuera',
    )
    const convenio = ambitosDe(simulacion(distritos, [], alianza))[0]
    expect(convenio.distritos).toHaveLength(13)
    expect(paridadGeneral(convenio).mensaje).toContain('mínimo de 7')
  })

  it('en coalición total la paridad se verifica solo sobre el convenio', () => {
    // Artículo 20.2: los integrantes «podrán distribuir los géneros libremente».
    // PRI sigla ocho distritos con una sola mujer; el conjunto llega a 8 porque
    // PAN carga las siete restantes. Ningún partido debe ser reprochado.
    const alianza = coalicion(PARTIDO.PRI, PARTIDO.PAN)
    const distritos = repartir(tablero('MHHHHHHH MMMMMMM', {}, alianza), (p) =>
      p <= 8 ? PARTIDO.PRI : PARTIDO.PAN,
    )
    const resultados = ambitosDe(simulacion(distritos, [], alianza)).flatMap((a) => evaluarMR(a))
    const generales = resultados.filter((r) => r.regla.startsWith('Paridad general'))
    expect(generales).toHaveLength(1)
    expect(generales[0].alcance).toBe('Coalición PAN-PRI · convenio')
    expect(generales[0].cumple).toBe(true)

    // Y cada integrante recibe la explicación de por qué no se le mide.
    const exenciones = resultados.filter((r) => r.regla === 'Paridad global del partido')
    expect(exenciones).toHaveLength(2)
    expect(exenciones.every((r) => r.cumple)).toBe(true)
    expect(exenciones[0].mensaje).toContain('distribuye libremente')
  })

  it('en coalición parcial cada integrante vuelve a responder por su paridad', () => {
    const alianza = coalicion(PARTIDO.PRI, PARTIDO.PAN)
    const distritos = repartir(tablero('MHHHHHHH MMMMMMM', {}, alianza), (p) =>
      p > 12 ? 'fuera' : p <= 6 ? PARTIDO.PRI : PARTIDO.PAN,
    )
    const resultados = ambitosDe(simulacion(distritos, [], alianza)).flatMap((a) => evaluarMR(a))
    const alcances = resultados
      .filter((r) => r.regla.startsWith('Paridad general'))
      .map((r) => r.alcance)
    expect(alcances).toEqual([
      'Coalición PAN-PRI · convenio',
      'PAN · paridad global',
      'PRI · paridad global',
    ])
    expect(resultados.some((r) => r.regla === 'Paridad global del partido')).toBe(false)
  })

  it('la candidatura común no exime a sus integrantes aunque abarque todo', () => {
    // Artículo 20.3: exige la del convenio y la de cada partido, sin importar el
    // alcance. La exención del 20.2 es exclusiva de la coalición total.
    const comun = { integrantes: [PARTIDO.PRI, PARTIDO.PAN], modalidad: 'Candidatura Común' as const }
    const distritos = repartir(tablero('MHHHHHHH MMMMMMM', {}, comun), (p) =>
      p <= 8 ? PARTIDO.PRI : PARTIDO.PAN,
    )
    const resultados = ambitosDe(simulacion(distritos, [], comun)).flatMap((a) => evaluarMR(a))
    expect(resultados.filter((r) => r.regla.startsWith('Paridad general'))).toHaveLength(3)
    expect(resultados.some((r) => r.regla === 'Paridad global del partido')).toBe(false)
  })

  it('el partido que compite solo la mide una vez, no dos', () => {
    const resultados = ambitosDe(simulacion(tablero('MMMHH MMMHH MMHHH'))).flatMap((a) => evaluarMR(a))
    expect(resultados.filter((r) => r.regla.startsWith('Paridad general'))).toHaveLength(1)
  })

  it('unifica siglados y distritos fuera del convenio en un solo registro', () => {
    const alianza = coalicion(PARTIDO.PRI, PARTIDO.PAN)
    // PRI sigla las ocho primeras posiciones; las siete restantes van fuera del
    // convenio, así que también las postula. Su universo es de quince.
    const distritos = repartir(tablero('MMMMHHHH HHHHHHH', {}, alianza), (p) =>
      p <= 8 ? PARTIDO.PRI : 'fuera',
    )
    const pri = ambitosDe(simulacion(distritos, [], alianza)).find(
      (a) => a.tipo === 'consolidado' && a.partido === PARTIDO.PRI,
    )!
    expect(pri.distritos).toHaveLength(15)
    expect(paridadGeneral(pri).mensaje).toContain('mínimo de 8')
  })
})

describe('paridad de bloques', () => {
  it('ajusta el máximo por género al tamaño del bloque', () => {
    const alianza = coalicion(PARTIDO.PRI, PARTIDO.PAN)
    // Siete distritos fuera del convenio: bloques de 3, 2 y 2, con máximos 2, 1 y 1.
    const conMujeres = repartir(tablero('MMMMMMMMMMMMMMM', {}, alianza), (p) =>
      p <= 8 ? PARTIDO.PRI : 'fuera',
    )
    const huerfanos = ambitosDe(simulacion(conMujeres, [], alianza)).find(
      (a) => a.etiqueta === 'PAN · postulaciones en lo individual',
    )!
    const alta = regla(paridadBloques(huerfanos), 'Paridad del bloque Alta')
    expect(alta.gravedad).toBe('sustitucion')
    expect(alta.mensaje).toContain('en un bloque de 3 el máximo por género es 2')
  })

  it('acepta el reparto 3-2 y 2-3 en los tres bloques', () => {
    const resultados = paridadBloques(ambitoDe(tablero('MMMHH HHMMM MMHHH')))
    expect(resultados.every((r) => r.cumple)).toBe(true)
  })

  it('es infracción en cuanto un género llega a cuatro en un bloque', () => {
    const bloqueAlta = regla(paridadBloques(ambitoDe(tablero('MMMMH HHMMM MMHHH'))), 'Paridad del bloque Alta')
    expect(bloqueAlta.gravedad).toBe('sustitucion')
    expect(bloqueAlta.mensaje).toContain('máximo por género es 3')
  })

  it('es pendiente mientras el bloque tenga distritos sin asignar', () => {
    const bloqueMedia = regla(paridadBloques(ambitoDe(tablero('MMMHH ..... MMHHH'))), 'Paridad del bloque Media')
    expect(bloqueMedia.gravedad).toBe('por-completar')
  })
})

describe('liderazgo de bloque', () => {
  it('se satisface con una mujer en cualquiera de las posiciones 1, 6 u 11', () => {
    expect(liderazgoBloque(ambitoDe(tablero('HHHHH MHHHH HHHHH'))).cumple).toBe(true)
    expect(liderazgoBloque(ambitoDe(tablero('HHHHH HHHHH MHHHH'))).cumple).toBe(true)
  })

  it('ignora a las mujeres que no están en la cabeza del bloque', () => {
    expect(liderazgoBloque(ambitoDe(tablero('HMMMM HMMMM HMMHH'))).cumple).toBe(false)
  })

  it('no cuenta mujeres en el bloque: mira la posición 1, 6 y 11', () => {
    // Los dos sentidos de «encabezar» en un solo tablero. Los bloques Alta y
    // Media tienen mayoría de fórmulas encabezadas por mujeres —4 de 5 cada
    // uno—, así que el 28.4 se satisface; pero las tres cabezas de bloque son
    // hombres, así que el 28.1 no.
    const ambito = ambitoDe(tablero('HMMMM HMMMM HMMHH'))
    expect(mayoriaBloqueImpar(ambito).cumple).toBe(true)
    const resultado = liderazgoBloque(ambito)
    expect(resultado.gravedad).toBe('sustitucion')
    expect(resultado.mensaje).toContain('Basta cambiar una')
  })

  it('se satisface con la cabeza aunque el resto del bloque sean hombres', () => {
    // El recíproco: una sola mujer, colocada en la posición 11, cumple el 28.1.
    const resultado = liderazgoBloque(ambitoDe(tablero('HHHHH HHHHH MHHHH')))
    expect(resultado.cumple).toBe(true)
    expect(resultado.mensaje).toContain('bloque Baja')
  })

  it('es infracción solo cuando las tres cabezas ya están ocupadas por hombres', () => {
    expect(liderazgoBloque(ambitoDe(tablero('HHHHH HHHHH HHHHH'))).gravedad).toBe('sustitucion')
    expect(liderazgoBloque(ambitoDe(tablero('HHHHH HHHHH .....'))).gravedad).toBe('por-completar')
  })
})

describe('mayoría femenina en bloques impares', () => {
  const alianza = coalicion(PARTIDO.PRI, PARTIDO.PAN)

  /** El tablero individual del PAN con `cuantos` huérfanos y las fórmulas dadas. */
  function huerfanosPAN(cuantos: number, formulas: Record<number, TokenFormula> = {}) {
    const primero = 15 - cuantos + 1
    const base = repartir(tablero('...............', {}, alianza), (p) =>
      p >= primero ? 'fuera' : PARTIDO.PRI,
    )
    const orden = ambitosDe(simulacion(base, [], alianza)).find(
      (a) => a.etiqueta === 'PAN · postulaciones en lo individual',
    )!
    const idPorPosicion = new Map(
      orden.distritos.map((d) => [d.posicion_rentabilidad, d.id_distrito]),
    )
    const distritos = base.map((d) => {
      if (d.postulacion.modo !== 'fuera') return d
      const posicion = [...idPorPosicion.entries()].find(([, id]) => id === d.id_distrito)?.[0]
      const formula = posicion ? formulas[posicion] : undefined
      return formula
        ? { ...d, postulacion: { modo: 'fuera' as const, formulas: { [PARTIDO.PAN]: formula } } }
        : d
    })
    return ambitosDe(simulacion(distritos, [], alianza)).find(
      (a) => a.etiqueta === 'PAN · postulaciones en lo individual',
    )!
  }

  const M = () => formula(perfil('Mujer'))
  const H = () => formula(perfil('Hombre'))

  it('exige mayoría en dos bloques cuando los tres son impares', () => {
    // Quince distritos reparten 5-5-5: los tres impares, mayoría de 3 en cada uno.
    const dosBloques = mayoriaBloqueImpar(ambitoDe(tablero('MMMHH MMMHH MMHHH')))
    expect(dosBloques.cumple).toBe(true)
    expect(dosBloques.mensaje).toContain('2 de los 3')

    const unoSolo = mayoriaBloqueImpar(ambitoDe(tablero('MMMHH MMHHH MMHHH')))
    expect(unoSolo.cumple).toBe(false)
    expect(unoSolo.mensaje).toContain('Los tres bloques son impares, así que dos deben')
  })

  it('exige mayoría en el único bloque impar, por la cláusula «o solo uno de ellos»', () => {
    // Siete distritos reparten 3-2-2: solo el bloque Alto es impar, y necesita 2.
    const sinMujeres = mayoriaBloqueImpar(huerfanosPAN(7, { 1: H(), 2: H(), 3: H() }))
    expect(sinMujeres.cumple).toBe(false)
    expect(sinMujeres.gravedad).toBe('sustitucion')
    expect(sinMujeres.mensaje).toContain('Alta (2 de 3)')

    const conDos = mayoriaBloqueImpar(huerfanosPAN(7, { 1: M(), 2: M(), 3: H() }))
    expect(conDos.cumple).toBe(true)
  })

  it('no basta una sola mujer en un bloque impar de tres', () => {
    expect(mayoriaBloqueImpar(huerfanosPAN(7, { 1: M(), 2: H(), 3: H() })).cumple).toBe(false)
  })

  it('se satisface con una sola mujer cuando los bloques impares son de uno', () => {
    // Dos distritos reparten 1-1-0: bloques Alto y Medio impares, mayoría = 1.
    expect(mayoriaBloqueImpar(huerfanosPAN(2, { 1: M(), 2: H() })).cumple).toBe(true)
  })

  it('da igual en cuál de los dos bloques impares esté la mujer', () => {
    expect(mayoriaBloqueImpar(huerfanosPAN(2, { 1: H(), 2: M() })).cumple).toBe(true)
  })

  it('es infracción si ambos bloques impares quedan sin mayoría femenina', () => {
    const resultado = mayoriaBloqueImpar(huerfanosPAN(2, { 1: H(), 2: H() }))
    expect(resultado.cumple).toBe(false)
    expect(resultado.gravedad).toBe('sustitucion')
  })

  it('es pendiente mientras queden posiciones por asignar', () => {
    expect(mayoriaBloqueImpar(huerfanosPAN(2)).gravedad).toBe('por-completar')
  })

  it('no aplica cuando ningún bloque es impar', () => {
    // Seis distritos reparten 2-2-2.
    const resultado = mayoriaBloqueImpar(huerfanosPAN(6))
    expect(resultado.cumple).toBe(true)
    expect(resultado.mensaje).toContain('Ningún bloque')
  })
})

describe('blindaje de rentabilidad baja', () => {
  it('rechaza cualquier mujer en las posiciones 14 y 15', () => {
    const resultado = blindajeBaja(ambitoDe(tablero('MMMHH MMMHH HHHMH')))
    expect(resultado.gravedad).toBe('sustitucion')
    expect(resultado.implicados).toHaveLength(1)
  })

  it('admite perfiles no binarios ahí', () => {
    expect(blindajeBaja(ambitoDe(tablero('MMMHH MMMHH HHHNN'))).cumple).toBe(true)
  })
})

describe('cuotas', () => {
  it('exige cuando menos una fórmula joven completa', () => {
    expect(cuotaJoven(ambitoDe(tablero('HHHHH HHHHH HHHHH'))).gravedad).toBe('sustitucion')
    const conJoven = tablero('HHHHH HHHHH HHHHH', { 3: formula(JOVEN) })
    expect(cuotaJoven(ambitoDe(conJoven)).cumple).toBe(true)
  })

  it('una sola fórmula joven en el convenio libera a todos los integrantes', () => {
    const alianza = coalicion(PARTIDO.PRI, PARTIDO.PAN)
    // Coalición total repartida 8-7, con una única fórmula joven en el convenio.
    const distritos = repartir(
      tablero('HHHHH HHHHH HHHHH', { 3: formula(JOVEN) }, alianza),
      (posicion) => (posicion % 2 === 1 ? PARTIDO.PRI : PARTIDO.PAN),
    )
    const resultados = evaluarSimulacion(simulacion(distritos, [], alianza))
    const joven = resultados.filter((r) => r.regla === 'Medida compensatoria de personas jóvenes')
    // Una sola evaluación, la del convenio, y cumplida. Ningún partido responde
    // por su cuenta: es el artículo 53.1 frente al 54.
    expect(joven).toHaveLength(1)
    expect(joven[0].alcance).toBe('Coalición PAN-PRI · convenio')
    expect(joven[0].cumple).toBe(true)
  })

  it('mide la proporción del artículo 27.4 en el tablero individual', () => {
    // El convenio siempre exige una; los huérfanos, una por cada quince
    // distritos redondeada. El umbral cae en ocho.
    const conFuera = (cuantos: number) => {
      const alianza = coalicion(PARTIDO.PRI, PARTIDO.PAN)
      const primero = 15 - cuantos + 1
      const distritos = repartir(tablero('...............', {}, alianza), (p) =>
        p >= primero ? 'fuera' : PARTIDO.PRI,
      )
      return ambitosDe(simulacion(distritos, [], alianza)).find(
        (a) => a.etiqueta === 'PAN · postulaciones en lo individual',
      )!
    }
    expect(minimoJovenes(conFuera(11))).toBe(1)
    expect(minimoJovenes(conFuera(8))).toBe(1)
    expect(minimoJovenes(conFuera(7))).toBe(0)
    expect(minimoJovenes(conFuera(2))).toBe(0)
  })

  it('da por cumplida la cuota joven cuando es matemáticamente inaplicable', () => {
    const alianza = coalicion(PARTIDO.PRI, PARTIDO.PAN)
    const distritos = repartir(tablero('...............', {}, alianza), (p) =>
      p > 8 ? 'fuera' : PARTIDO.PRI,
    )
    const huerfanos = ambitosDe(simulacion(distritos, [], alianza)).find(
      (a) => a.etiqueta === 'PAN · postulaciones en lo individual',
    )!
    // Siete distritos: 7/15 redondea a cero.
    expect(huerfanos.distritos).toHaveLength(7)
    const resultado = cuotaJoven(huerfanos)
    expect(resultado.cumple).toBe(true)
    expect(resultado.mensaje).toContain('No aplicable')
  })

  it('exige fórmula joven propia cuando el partido postula solo en once distritos', () => {
    const alianza = coalicion(PARTIDO.PRI, PARTIDO.PAN)
    // Coalición flexible: cuatro en convenio, once huérfanos.
    const distritos = repartir(tablero('...............', {}, alianza), (p) =>
      p > 4 ? 'fuera' : PARTIDO.PRI,
    )
    const huerfanos = ambitosDe(simulacion(distritos, [], alianza)).find(
      (a) => a.etiqueta === 'PAN · postulaciones en lo individual',
    )!
    expect(huerfanos.distritos).toHaveLength(11)
    const resultado = cuotaJoven(huerfanos)
    expect(resultado.cumple).toBe(false)
    expect(resultado.mensaje).toContain('Falta 1')
  })

  it('nunca incumple: la medida del Distrito XV es optativa', () => {
    const sinIndigena = cuotaIndigena(ambitoDe(tablero('HHHHH HHHHH HHHHH')))
    expect(sinIndigena.cumple).toBe(true)
    expect(sinIndigena.gravedad).toBeUndefined()
    expect(sinIndigena.mensaje).toContain('optativo')

    const conIndigena = tablero('HHHHH HHHHH HHHHH', { [POSICION_XV_PAN]: formula(INDIGENA) })
    const acreditada = cuotaIndigena(ambitoDe(conIndigena))
    expect(acreditada.cumple).toBe(true)
    expect(acreditada.mensaje).toContain('acreditada')
  })

  it('advierte que el Distrito XV de PAN cae además en posición blindada', () => {
    const resultado = cuotaIndigena(ambitoDe(tablero('HHHHH HHHHH HHHHH')))
    expect(resultado.mensaje).toContain('menor porcentaje de votación')
  })

  it('no exige nada al ámbito que no incluye el Distrito XV', () => {
    const ambito = ambitoDe(
      tablero('...............').filter((d) => d.posicion_rentabilidad !== POSICION_XV_PAN),
    )
    expect(cuotaIndigena(ambito).cumple).toBe(true)
  })
})

describe('umbral de registro para RP', () => {
  const alianza = coalicion(PARTIDO.PRI, PARTIDO.PAN)

  /** Reparte un convenio y llena de fórmulas los tableros indicados. */
  function conHuella(sigladosHasta: number, llenar: { convenio?: boolean; propios?: boolean }) {
    const base = repartir(tablero('...............', {}, alianza), (p) =>
      p > sigladosHasta ? 'fuera' : p % 2 === 1 ? PARTIDO.PRI : PARTIDO.PAN,
    )
    const distritos = base.map((d) => {
      if (d.postulacion.modo === 'convenio' && llenar.convenio) {
        return { ...d, postulacion: { ...d.postulacion, formula: formula(perfil('Hombre')) } }
      }
      if (d.postulacion.modo === 'fuera' && llenar.propios) {
        return {
          ...d,
          postulacion: {
            modo: 'fuera' as const,
            formulas: { [PARTIDO.PAN]: formula(perfil('Hombre')), [PARTIDO.PRI]: formula(perfil('Hombre')) },
          },
        }
      }
      return d
    })
    return ambitosDe(simulacion(distritos, [], alianza))
  }

  it('cuenta todo el convenio, no solo lo que el partido sigló', () => {
    // Convenio de 12 repartido 6-6, con los 12 llenos. El PAN sigló 6, pero
    // postula en los 12: la huella supera el mínimo sin tocar los huérfanos.
    const resultado = umbralRegistroRP(conHuella(12, { convenio: true }), PARTIDO.PAN)
    expect(resultado.cumple).toBe(true)
    expect(resultado.mensaje).toContain('postula en 12 distritos')
    expect(resultado.mensaje).toContain('12 por convenio y 0 por su cuenta')
  })

  it('suma los distritos que el partido postula por su cuenta', () => {
    // Coalición flexible: 4 en convenio y 11 huérfanos. Ni una ni otros bastan
    // por separado; juntos dan 15.
    const soloConvenio = umbralRegistroRP(conHuella(4, { convenio: true }), PARTIDO.PAN)
    expect(soloConvenio.cumple).toBe(false)
    expect(soloConvenio.mensaje).toContain('faltan 7')

    const completo = umbralRegistroRP(conHuella(4, { convenio: true, propios: true }), PARTIDO.PAN)
    expect(completo.cumple).toBe(true)
    expect(completo.mensaje).toContain('4 por convenio y 11 por su cuenta')
  })

  it('nunca queda por debajo de lo alcanzable: la huella llega a quince', () => {
    // El defecto anterior medía sobre lo siglado, y con 12 repartidos 6-6 ningún
    // integrante podía pasar de 9. La regla era insatisfacible.
    for (const partido of [PARTIDO.PRI, PARTIDO.PAN] as const) {
      const resultado = umbralRegistroRP(conHuella(12, { convenio: true, propios: true }), partido)
      expect(resultado.cumple).toBe(true)
      expect(resultado.mensaje).toContain('postula en 15 distritos')
    }
  })

  it('se agrupa con la Lista "A", que es lo que habilita', () => {
    const resultado = umbralRegistroRP(conHuella(12, { convenio: true }), PARTIDO.PAN)
    expect(resultado.alcance).toBe('PAN · Lista "A"')
    expect(resultado.ambito).toBe('RP')
  })

  it('para un partido que compite solo cuenta sus quince distritos', () => {
    const ambitos = ambitosDe(simulacion(tablero('HHHHH HHHHH H....')))
    const resultado = umbralRegistroRP(ambitos, PARTIDO.PAN)
    expect(resultado.cumple).toBe(true)
    expect(resultado.mensaje).toContain('11 por convenio')
  })

  it('es pendiente mientras falten distritos por llenar, nunca infracción', () => {
    const ambitos = ambitosDe(simulacion(tablero('HHHHH HHHHH .....')))
    const resultado = umbralRegistroRP(ambitos, PARTIDO.PAN)
    expect(resultado.cumple).toBe(false)
    expect(resultado.gravedad).toBe('por-completar')
    expect(resultado.mensaje).toContain('faltan 1')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Representación proporcional
// ─────────────────────────────────────────────────────────────────────────────

const MR_MAYORIA_HOMBRES = tablero('HHHHH HHHHH MMMHH')

/** Doce distritos asignados, seis y seis: la MR no subrepresenta a nadie. */
const MR_EN_EQUIVALENCIA = 'MMMHH MMHH. M..HH'

function ambitoRP(patronMR: string, patronLista: string, ajustes: Record<number, TokenFormula> = {}) {
  const estado = simulacion(tablero(patronMR), [lista(PARTIDO.PAN, patronLista, ajustes)])
  return ambitosRP(estado)[0]
}

describe('alternancia de la Lista "A"', () => {
  it('acepta la cremallera completa', () => {
    expect(alternanciaRP(ambitoRP('HHHHH HHHHH HHHHH', 'MHMHM')).cumple).toBe(true)
    expect(alternanciaRP(ambitoRP('HHHHH HHHHH HHHHH', 'HMHMH')).cumple).toBe(true)
  })

  it('es infracción en cuanto dos fórmulas exigen encabezados opuestos', () => {
    const resultado = alternanciaRP(ambitoRP('HHHHH HHHHH HHHHH', 'MMHMH'))
    expect(resultado.gravedad).toBe('sustitucion')
  })

  it('señala la fórmula desalineada, no a las que ya alternaban entre sí', () => {
    // MMHMH alterna limpio a partir de la posición 2: la que sobra es la 1.
    expect(alternanciaRP(ambitoRP('HHHHH HHHHH HHHHH', 'MMHMH')).implicados).toEqual([1])
    expect(alternanciaRP(ambitoRP('HHHHH HHHHH HHHHH', 'HMHMM')).implicados).toEqual([5])
  })

  it('detecta el conflicto aunque las fórmulas no sean contiguas', () => {
    expect(alternanciaRP(ambitoRP('HHHHH HHHHH HHHHH', 'M..M.')).gravedad).toBe('sustitucion')
    expect(alternanciaRP(ambitoRP('HHHHH HHHHH HHHHH', 'M..H.')).gravedad).toBe('por-completar')
  })

  it('cuenta los perfiles no binarios como hombres', () => {
    expect(alternanciaRP(ambitoRP('HHHHH HHHHH HHHHH', 'NMNMN')).cumple).toBe(true)
  })
})

describe('encabezado compensatorio', () => {
  it('exige que encabece el género subrepresentado en la MR del partido', () => {
    expect(generoSubrepresentado(evaluados(MR_MAYORIA_HOMBRES))).toBe('Mujer')
    const resultado = encabezadoCompensatorioRP(ambitoRP('HHHHH HHHHH MMMHH', 'HMHMH'))
    expect(resultado.cumple).toBe(false)
    expect(resultado.gravedad).toBe('sustitucion')
    expect(encabezadoCompensatorioRP(ambitoRP('HHHHH HHHHH MMMHH', 'MHMHM')).cumple).toBe(true)
  })

  it('deja libre el encabezado cuando la MR está en equivalencia', () => {
    expect(generoSubrepresentado(evaluados(tablero(MR_EN_EQUIVALENCIA)))).toBeNull()
    expect(encabezadoCompensatorioRP(ambitoRP(MR_EN_EQUIVALENCIA, 'HMHMH')).cumple).toBe(true)
    expect(encabezadoCompensatorioRP(ambitoRP(MR_EN_EQUIVALENCIA, 'MHMHM')).cumple).toBe(true)
  })

  it('deja libre el encabezado del partido que sigló cero distritos', () => {
    const alianza = coalicion(PARTIDO.PRI, PARTIDO.PAN)
    const estado = simulacion(
      repartir(tablero('...............', {}, alianza), () => PARTIDO.PAN),
      [lista(PARTIDO.PRI, 'MHMHM')],
      alianza,
    )
    const resultado = encabezadoCompensatorioRP(ambitosRP(estado)[0])
    expect(resultado.cumple).toBe(true)
    expect(resultado.mensaje).toContain('libre determinación')
  })

  it('es pendiente mientras queden distritos de MR por asignar', () => {
    const resultado = encabezadoCompensatorioRP(ambitoRP('HHHHH HHHHH MMM..', 'HMHMH'))
    expect(resultado.gravedad).toBe('por-completar')
    expect(resultado.mensaje).toContain('subsanable')
  })
})

describe('cuota de inclusión en RP', () => {
  const conCuota = formula(perfil('Mujer', { accionAfirmativa: 'Discapacidad' }))

  it('se satisface con una fórmula acreditada en las tres primeras posiciones', () => {
    expect(accionAfirmativaRP(ambitoRP('HHHHH HHHHH HHHHH', 'HMHMH', { 2: conCuota })).cumple).toBe(true)
  })

  it('admite los cuatro grupos que la norma enumera, y solo esos', () => {
    const admitidos = ['Discapacidad', 'Diversidad Sexual', 'Adulto Mayor', 'Migrante'] as const
    for (const grupo of admitidos) {
      expect(acreditaInclusionRP(formula(perfil('Mujer', { accionAfirmativa: grupo })))).toBe(true)
    }
    // La adscripción indígena y la juventud se atienden territorialmente en MR.
    expect(acreditaInclusionRP(formula(perfil('Mujer', { accionAfirmativa: 'Indígena' })))).toBe(false)
    expect(acreditaInclusionRP(formula(JOVEN))).toBe(false)
  })

  it('no da por acreditada una fórmula indígena en el tramo 1-3', () => {
    const indigena = formula(perfil('Mujer', { accionAfirmativa: 'Indígena' }))
    const resultado = accionAfirmativaRP(ambitoRP('HHHHH HHHHH HHHHH', 'HMHMH', { 2: indigena }))
    expect(resultado.cumple).toBe(false)
    expect(resultado.gravedad).toBe('sustitucion')
  })

  it('no admite la acreditada en la posición 4', () => {
    const resultado = accionAfirmativaRP(ambitoRP('HHHHH HHHHH HHHHH', 'HMHMH', { 4: conCuota }))
    expect(resultado.cumple).toBe(false)
    expect(resultado.gravedad).toBe('sustitucion')
  })

  it('es pendiente mientras el tramo 1-3 esté incompleto', () => {
    expect(accionAfirmativaRP(ambitoRP('HHHHH HHHHH HHHHH', 'HM...')).gravedad).toBe('por-completar')
  })
})

describe('admisión en la Lista "A"', () => {
  it('rechaza la fórmula que rompe la cremallera', () => {
    const ambito = ambitoRP('HHHHH HHHHH HHHHH', 'M....')
    expect(admiteEnListaRP(ambito, 2, formula(perfil('Mujer')))?.gravedad).toBe('sustitucion')
    expect(admiteEnListaRP(ambito, 2, formula(perfil('Hombre')))).toBeNull()
  })

  it('rechaza el encabezado que contradice la compensación con la MR cerrada', () => {
    const ambito = ambitoRP('HHHHH HHHHH MMMHH', '.....')
    expect(admiteEnListaRP(ambito, 1, formula(perfil('Hombre')))?.gravedad).toBe('sustitucion')
    expect(admiteEnListaRP(ambito, 1, formula(perfil('Mujer')))).toBeNull()
  })

  it('no rebota el encabezado mientras la MR siga abierta', () => {
    const ambito = ambitoRP('HHHHH HHHHH MMM..', '.....')
    expect(admiteEnListaRP(ambito, 1, formula(perfil('Hombre')))).toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Dictamen completo
// ─────────────────────────────────────────────────────────────────────────────

describe('dictamen', () => {
  const distritos = tablero('MMMHH MMMHH MMHHH', {
    5: formula(JOVEN),
    [POSICION_XV_PAN]: formula(INDIGENA),
  })
  const listaValida = lista(PARTIDO.PAN, 'HMHMH', {
    2: formula(perfil('Mujer', { accionAfirmativa: 'Discapacidad' })),
  })

  it('cierra una postulación que satisface las quince reglas', () => {
    const resultados = evaluarSimulacion(simulacion(distritos, [listaValida]))
    const incumplidas = resultados.filter((r) => !r.cumple)
    expect(incumplidas.map((r) => `${r.alcance}: ${r.regla}`)).toEqual([])
    expect(esCerrable(resultados)).toBe(true)
  })

  it('cierra aunque el Distrito XV no lleve fórmula indígena', () => {
    // Antes esto bloqueaba el cierre. El artículo 55.1 dice «procurarán», así
    // que no postular la medida no impide el registro.
    const sinIndigena = tablero('MMMHH MMMHH MMHHH', { 5: formula(JOVEN) })
    const resultados = evaluarSimulacion(simulacion(sinIndigena, [listaValida]))
    expect(regla(resultados, 'Medida compensatoria de personas indígenas').cumple).toBe(true)
    expect(esCerrable(resultados)).toBe(true)
  })

  it('no reprocha nada a las fórmulas mixtas que ocupan distritos ordinarios', () => {
    const mixtas = tablero('MMMHH MMMHH MMHHH', {
      1: formula(perfil('Mujer', { accionAfirmativa: 'Migrante' }), perfil('Mujer')),
      5: formula(JOVEN),
      [POSICION_XV_PAN]: formula(INDIGENA),
    })
    expect(evaluarTokens(simulacion(mixtas, []))).toEqual([])
    expect(esCerrable(evaluarSimulacion(simulacion(mixtas, [listaValida])))).toBe(true)
  })

  it('no cierra si falta cualquier pieza, aunque no haya infracción', () => {
    const sinJoven = tablero('MMMHH MMMHH MMHHH', { [POSICION_XV_PAN]: formula(INDIGENA) })
    const resultados = evaluarSimulacion(simulacion(sinJoven, [listaValida]))
    expect(esCerrable(resultados)).toBe(false)
    expect(regla(resultados, 'Medida compensatoria de personas jóvenes').cumple).toBe(false)
  })

  it('separa lo irreparable de lo que todavía se puede corregir', () => {
    const aMedias = tablero('MMMHH ..... .....')
    const resultados = evaluarSimulacion(simulacion(aMedias, [lista(PARTIDO.PAN, '.....')]))
    expect(requierenSustitucion(resultados)).toEqual([])
    expect(porCompletar(resultados).length).toBeGreaterThan(0)
  })

  it('denuncia una fórmula mal armada que llegó desde fuera de la interfaz', () => {
    const corrupto = tablero('MMMHH MMMHH MMHHH', {
      1: formula(perfil('Mujer'), perfil('Hombre')),
    })
    const resultados = evaluarTokens(simulacion(corrupto, []))
    expect(resultados).toHaveLength(1)
    expect(resultados[0].alcance).toMatch(/^Distrito /)
    expect(resultados[0].gravedad).toBe('sustitucion')
  })

  it('emite un dictamen por cada Lista "A" de la alianza', () => {
    const alianza = coalicion(PARTIDO.PRI, PARTIDO.PAN)
    const estado = simulacion(
      repartir(tablero('...............', {}, alianza), (p) => (p % 2 === 1 ? PARTIDO.PRI : PARTIDO.PAN)),
      // En orden de registro, como las crea el store con `listasVacias`.
      [lista(PARTIDO.PAN, '.....'), lista(PARTIDO.PRI, '.....')],
      alianza,
    )
    const alcances = new Set(
      evaluarSimulacion(estado)
        .filter((r) => r.ambito === 'RP')
        .map((r) => r.alcance),
    )
    expect([...alcances]).toEqual(['PAN · Lista "A"', 'PRI · Lista "A"'])
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Recuento
// ─────────────────────────────────────────────────────────────────────────────

describe('recuento de fórmulas y candidaturas', () => {
  const MUJER = perfil('Mujer')
  const HOMBRE = perfil('Hombre')
  const NO_BINARIO = perfil('No Binario')
  const DISCAPACIDAD = perfil('Mujer', { accionAfirmativa: 'Discapacidad' })

  it('cuenta dos candidaturas por cada fórmula', () => {
    const r = recontar([formula(MUJER), formula(HOMBRE)])
    expect(r.formulas).toBe(2)
    expect(r.candidaturas).toBe(4)
  })

  it('atribuye el género de la fórmula a quien la encabeza', () => {
    const r = recontar([formula(HOMBRE, MUJER), formula(MUJER)])
    expect(r.encabezan).toEqual({ Mujer: 1, Hombre: 1 })
    // Pero las cuatro personas se cuentan por su género declarado.
    expect(r.personas).toEqual({ Mujer: 3, Hombre: 1, 'No Binario': 0 })
  })

  it('saca a las personas no binarias del conteo de fórmulas, no del de candidaturas', () => {
    const r = recontar([formula(NO_BINARIO)])
    // Para paridad ocupan espacios del género masculino.
    expect(r.encabezan).toEqual({ Mujer: 0, Hombre: 1 })
    // Como personas siguen siendo no binarias, y no desaparecen.
    expect(r.personas['No Binario']).toBe(2)
  })

  it('cuenta a las personas de una fórmula mixta aunque no acredite ninguna cuota', () => {
    // El caso que motiva el panel: hombre joven con suplencia de hombre indígena.
    // Es postulable y legal, pero no acredita ni la cuota joven ni la indígena.
    const mixta = formula(JOVEN, INDIGENA)
    const r = recontar([mixta])
    const joven = r.grupos.find((g) => g.grupo === 'Joven')!
    const indigena = r.grupos.find((g) => g.grupo === 'Indígena')!

    expect(joven).toMatchObject({ formulas: 0, candidaturas: 1, sinAcreditar: 1 })
    expect(indigena).toMatchObject({ formulas: 0, candidaturas: 1, sinAcreditar: 1 })
  })

  it('no reporta nada sin acreditar cuando la fórmula es homogénea', () => {
    const r = recontar([formula(INDIGENA)])
    const indigena = r.grupos.find((g) => g.grupo === 'Indígena')!
    expect(indigena).toMatchObject({ formulas: 1, candidaturas: 2, sinAcreditar: 0 })
  })

  it('suma la persona suelta a la fórmula que sí acredita', () => {
    const r = recontar([formula(DISCAPACIDAD), formula(DISCAPACIDAD, MUJER)])
    const grupo = r.grupos.find((g) => g.grupo === 'Discapacidad')!
    // Dos personas en la fórmula acreditada, más una en la mixta.
    expect(grupo).toMatchObject({ formulas: 1, candidaturas: 3, sinAcreditar: 1 })
  })

  it('reconoce la diversidad sexual de las personas no binarias sin declararla', () => {
    const r = recontar([formula(NO_BINARIO), formula(NO_BINARIO, HOMBRE)])
    const grupo = r.grupos.find((g) => g.grupo === 'Diversidad Sexual')!
    expect(grupo).toMatchObject({ formulas: 1, candidaturas: 3, sinAcreditar: 1 })
  })

  it('en coalición total solo el convenio lleva mínimo propio', () => {
    const alianza = coalicion(PARTIDO.PRI, PARTIDO.PAN)
    // PRI sigla ocho distritos; PAN, siete. Nada queda fuera del convenio.
    const distritos = repartir(tablero('MMMMHHHH HHHHHHH', {}, alianza), (p) =>
      p <= 8 ? PARTIDO.PRI : PARTIDO.PAN,
    )
    const { paridad } = recuentoDe(simulacion(distritos, [], alianza))
    // El artículo 20.2 verifica la paridad exclusivamente sobre el conjunto.
    expect(paridad.map((f) => [f.siglas, f.total, f.minimo])).toEqual([
      ['Convenio', 15, 8],
      ['PAN', 7, null],
      ['PRI', 8, null],
    ])
    expect(paridad[2].mujeres).toBe(4)
  })

  it('en coalición parcial cada integrante recupera su mínimo propio', () => {
    const alianza = coalicion(PARTIDO.PRI, PARTIDO.PAN)
    // Doce distritos en convenio y tres fuera: deja de ser total.
    const distritos = repartir(tablero('MMMMHHHH HHHHHHH', {}, alianza), (p) =>
      p > 12 ? 'fuera' : p <= 6 ? PARTIDO.PRI : PARTIDO.PAN,
    )
    const { paridad } = recuentoDe(simulacion(distritos, [], alianza))
    expect(paridad.every((f) => f.minimo !== null)).toBe(true)
  })

  it('separa mayoría relativa de la Lista "A"', () => {
    const distritos = tablero('MMMHH MMMHH MMHHH')
    const estado = simulacion(distritos, [lista(PARTIDO.PAN, 'HMHMH')])
    const { mayoria, proporcional } = recuentoDe(estado)
    expect(mayoria.formulas).toBe(15)
    expect(proporcional.formulas).toBe(5)
    // No se suman: una fórmula de RP no ocupa ningún distrito.
    expect(mayoria.candidaturas).toBe(30)
    expect(proporcional.candidaturas).toBe(10)
  })

  it('cuenta una vez por partido las fórmulas de un distrito fuera del convenio', () => {
    const alianza = coalicion(PARTIDO.PRI, PARTIDO.PAN)
    const base = repartir(tablero('...............', {}, alianza), (p) =>
      p > 13 ? 'fuera' : PARTIDO.PRI,
    )
    const distritos = base.map((d) =>
      d.postulacion.modo === 'fuera'
        ? {
            ...d,
            postulacion: {
              modo: 'fuera' as const,
              formulas: { [PARTIDO.PRI]: formula(MUJER), [PARTIDO.PAN]: formula(HOMBRE) },
            },
          }
        : d,
    )
    // Dos distritos huérfanos con dos partidos postulando en cada uno.
    expect(recuentoDe(simulacion(distritos, [], alianza)).mayoria.formulas).toBe(4)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Criterios de interpretación
// ─────────────────────────────────────────────────────────────────────────────

describe('criterios de interpretación', () => {
  const alianza = coalicion(PARTIDO.PRI, PARTIDO.PAN)

  /** El ámbito individual de PAN con `cuantos` distritos fuera del convenio. */
  function tableroDe(cuantos: number, formulas: Record<number, TokenFormula> = {}): Ambito {
    const primero = 15 - cuantos + 1
    const base = repartir(tablero('...............', {}, alianza), (p) =>
      p >= primero ? 'fuera' : PARTIDO.PRI,
    )
    const orden = ambitosDe(simulacion(base, [], alianza)).find(
      (a) => a.etiqueta === 'PAN · postulaciones en lo individual',
    )!
    const idPorPosicion = new Map(
      orden.distritos.map((d) => [d.posicion_rentabilidad, d.id_distrito]),
    )
    const distritos = base.map((d) => {
      if (d.postulacion.modo !== 'fuera') return d
      const posicion = [...idPorPosicion.entries()].find(([, id]) => id === d.id_distrito)?.[0]
      const formula = posicion ? formulas[posicion] : undefined
      return formula
        ? { ...d, postulacion: { modo: 'fuera' as const, formulas: { [PARTIDO.PAN]: formula } } }
        : d
    })
    return ambitosDe(simulacion(distritos, [], alianza)).find(
      (a) => a.etiqueta === 'PAN · postulaciones en lo individual',
    )!
  }

  it('sin criterios explícitos corre la lectura de la ley', () => {
    const ambito = ambitoDe(tablero('MMMHH MMMHH MHHHH'))
    expect(paridadGeneral(ambito)).toEqual(paridadGeneral(ambito, CRITERIOS_LEY))
    expect(criteriosFueraDeLey(CRITERIOS_LEY)).toEqual([])
  })

  describe('universo de la paridad global (artículo 20.2)', () => {
    // Ocho distritos ocupados —cuatro y cuatro— y siete vacíos.
    const aMedias = ambitoDe(tablero('MMMMHHHH .......'))

    it('sobre el ámbito completo mide contra los quince', () => {
      const r = paridadGeneral(aMedias, { ...CRITERIOS_LEY, denominadorParidad: 'ambito' })
      expect(r.cumple).toBe(false)
      expect(r.mensaje).toContain('mínimo de 8')
    })

    it('sobre lo registrado mide contra las ocho colocadas', () => {
      const r = paridadGeneral(aMedias, { ...CRITERIOS_LEY, denominadorParidad: 'registradas' })
      expect(r.cumple).toBe(true)
      expect(r.mensaje).toContain('4 de 8')
      expect(r.mensaje).toContain('no sobre los 15 distritos')
    })

    it('sobre lo registrado equivale a exigir que las mujeres no sean menos', () => {
      const criterios = { ...CRITERIOS_LEY, denominadorParidad: 'registradas' as const }
      // Tres mujeres y cuatro hombres: no alcanza.
      expect(paridadGeneral(ambitoDe(tablero('MMMHHHH ........')), criterios).cumple).toBe(false)
      // Cuatro y tres: el universo impar se lo lleva la mujer.
      expect(paridadGeneral(ambitoDe(tablero('MMMMHHH ........')), criterios).cumple).toBe(true)
    })

    it('el balance usa el mismo universo que el dictamen', () => {
      const estado = simulacion(tablero('MMMMHHHH .......'))
      const porAmbito = recuentoDe(estado, CRITERIOS_LEY).paridad[0]
      const porRegistro = recuentoDe(estado, {
        ...CRITERIOS_LEY,
        denominadorParidad: 'registradas',
      }).paridad[0]
      expect(porAmbito.minimo).toBe(8)
      expect(porRegistro.minimo).toBe(4)
    })
  })

  describe('requisito imposible por geometría (artículos 27.4, 28.2 y 28.5)', () => {
    // Cinco distritos: bloques 2-2-1. El único impar es el bajo, y su único
    // distrito está prohibido a las mujeres. Once da 4-4-3 con el mismo choque.
    const IMPOSIBLES = [5, 11]

    it('la lectura de la ley lo reporta y explica que no hay acomodo', () => {
      for (const cuantos of IMPOSIBLES) {
        const r = mayoriaBloqueImpar(tableroDe(cuantos), CRITERIOS_LEY)
        expect(r.cumple, `${cuantos} distritos`).toBe(false)
        expect(r.mensaje).toContain('Ningún acomodo lo satisface')
      }
    })

    it('la lectura del 27.4 lo tiene por no exigible, sin callarlo', () => {
      for (const cuantos of IMPOSIBLES) {
        const r = mayoriaBloqueImpar(tableroDe(cuantos), {
          ...CRITERIOS_LEY,
          aritmeticaImposible: 'inaplicable',
        })
        expect(r.cumple, `${cuantos} distritos`).toBe(true)
        expect(r.mensaje).toContain('No aplicable')
        expect(r.mensaje).toContain('artículo 27.4')
      }
    })

    it('no toca los ámbitos donde el requisito sí cabe', () => {
      // Nueve distritos: bloques 3-3-3, los tres impares. El 28.4 pide dos con
      // mayoría, y los bloques alto y medio pueden darla.
      for (const criterios of [CRITERIOS_LEY, { ...CRITERIOS_LEY, aritmeticaImposible: 'inaplicable' as const }]) {
        const r = mayoriaBloqueImpar(tableroDe(9), criterios)
        expect(r.cumple).toBe(false)
        expect(r.mensaje).not.toContain('No aplicable')
      }
    })
  })

  it('señala qué criterios quedaron fuera de la ley', () => {
    expect(criteriosFueraDeLey({ ...CRITERIOS_LEY, denominadorParidad: 'registradas' })).toEqual([
      'denominadorParidad',
    ])
    expect(
      criteriosFueraDeLey({ denominadorParidad: 'registradas', aritmeticaImposible: 'inaplicable' }),
    ).toHaveLength(2)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Postulación parcial (artículo 27)
// ─────────────────────────────────────────────────────────────────────────────

describe('postulación parcial', () => {
  /** Retira del ámbito los distritos que ocupan esas posiciones del ranking. */
  function sinPostularEn(distritos: DistritoActivo[], posiciones: number[]): DistritoActivo[] {
    return distritos.map((d) =>
      posiciones.includes(d.posicion_rentabilidad)
        ? { ...d, postulacion: { modo: 'sin-postular' as const } }
        : d,
    )
  }

  const RETIRADOS = [3, 7, 11, 15]
  const parcial = () => ambitoDe(sinPostularEn(tablero('...............'), RETIRADOS))

  it('deja fuera del ámbito los distritos donde no se postula', () => {
    expect(parcial().distritos).toHaveLength(11)
  })

  it('renumera de uno en uno, sin heredar la posición del tablero de quince', () => {
    // Artículo 27.1: los distritos donde se vaya a postular se ordenan de mayor
    // a menor por porcentaje. No conservan el lugar que tenían entre los quince.
    expect(parcial().distritos.map((d) => d.posicion_rentabilidad)).toEqual(
      Array.from({ length: 11 }, (_, i) => i + 1),
    )
  })

  it('conserva el orden relativo: retirar no reordena, solo renumera', () => {
    const completo = ambitoDe(tablero('...............'))
    const esperados = completo.distritos
      .filter((d) => !RETIRADOS.includes(d.posicion_rentabilidad))
      .map((d) => d.id_distrito)
    expect(parcial().distritos.map((d) => d.id_distrito)).toEqual(esperados)
  })

  it('reparte los once en tres bloques, con el excedente en los primeros', () => {
    // Artículo 27.1: tres bloques de número igual y, si no se puede, los
    // primeros llevan uno más, sin que la diferencia pase de un distrito.
    const cuenta = (bloque: string) =>
      parcial().distritos.filter((d) => d.bloque === bloque).length
    expect([cuenta('Alta'), cuenta('Media'), cuenta('Baja')]).toEqual([4, 4, 3])
  })

  it('mueve la prohibición del 28.2 a las nuevas posiciones de menor votación', () => {
    expect(parcial().distritos.filter((d) => d.esBlindada).map((d) => d.posicion_rentabilidad))
      .toEqual([10, 11])
  })

  it('mide las demás reglas sobre el ámbito reducido', () => {
    // El piso del cincuenta por ciento baja de ocho a seis, y la medida de
    // personas jóvenes sigue la proporción del 27.4.
    const registro = ambitosDe(
      simulacion(sinPostularEn(tablero('...............'), RETIRADOS)),
    ).find((a) => a.tipo === 'consolidado')!
    expect(registro.distritos).toHaveLength(11)
    expect(paridadGeneral(registro).mensaje).toContain('mínimo de 6')
    expect(minimoJovenes({ ...parcial(), fuera: true })).toBe(1)
  })

  it('un ámbito sin ningún distrito retirado se comporta como antes', () => {
    const ambito = ambitoDe(tablero('...............'))
    expect(ambito.distritos).toHaveLength(15)
    expect(ambito.distritos.filter((d) => d.esBlindada).map((d) => d.posicion_rentabilidad))
      .toEqual([14, 15])
  })
})

// ─── El reparto que propone el llenado rápido ───────────────────────────────

/** Retira de la postulación las posiciones indicadas, como hace el artículo 27. */
function retirar(distritos: DistritoActivo[], posiciones: number[]): DistritoActivo[] {
  return distritos.map((d) =>
    posiciones.includes(d.posicion_rentabilidad)
      ? { ...d, postulacion: { modo: 'sin-postular' as const } }
      : d,
  )
}

/** Coloca el reparto propuesto, con la fórmula joven que pida. */
function aplicar(distritos: DistritoActivo[], reparto: Reparto): DistritoActivo[] {
  let falta = reparto.faltaJoven
  return distritos.map((d) => {
    const genero = reparto.porDistrito.get(d.id_distrito)
    if (!genero || d.postulacion.modo !== 'convenio' || d.postulacion.formula) return d
    const joven = falta
    falta = false
    return {
      ...d,
      postulacion: { ...d.postulacion, formula: formula(perfil(genero, { esJoven: joven })) },
    }
  })
}

function incumplidas(distritos: DistritoActivo[]): string[] {
  return ambitosDe(simulacion(distritos))
    .flatMap((a) => evaluarMR(a))
    .filter((r) => !r.cumple)
    .map((r) => r.regla)
}

describe('repartoNecesario', () => {
  it('propone un tablero de quince que no incumple ninguna regla', () => {
    const vacio = tablero('...............')
    const reparto = repartoNecesario(ambitoDe(vacio))

    expect(reparto.porDistrito.size).toBe(15)
    expect(incumplidas(aplicar(vacio, reparto))).toEqual([])
  })

  it('propone lo mínimo que la norma exige, no lo máximo que permite', () => {
    const reparto = repartoNecesario(ambitoDe(tablero('...............')))

    // Ocho es el piso del 23.1 para quince distritos; el reparto no lo rebasa.
    expect(reparto.faltan).toEqual({ Mujer: 8, Hombre: 7 })
  })

  it('respeta lo ya colocado y solo propone para los distritos vacíos', () => {
    const medio = tablero('HHH.. ..... .....')
    const reparto = repartoNecesario(ambitoDe(medio))

    expect(reparto.porDistrito.size).toBe(12)
    for (const d of medio.slice(0, 3)) {
      expect(reparto.porDistrito.has(d.id_distrito)).toBe(false)
    }
    // Los tres hombres del bloque alto no se mueven, así que las mujeres que
    // faltan tienen que salir de los otros dos bloques.
    expect(incumplidas(aplicar(medio, reparto))).toEqual([])
  })

  it('nunca propone mujer en una posición que el 28.2 cerró', () => {
    const vacio = tablero('...............')
    const ambito = ambitoDe(vacio)
    const reparto = repartoNecesario(ambito)

    for (const distrito of ambito.distritos) {
      if (!distrito.esBlindada) continue
      expect(reparto.porDistrito.get(distrito.id_distrito)).toBe('Hombre')
    }
  })

  it('pide una fórmula joven, y deja de pedirla cuando ya hay una', () => {
    expect(repartoNecesario(ambitoDe(tablero('...............'))).faltaJoven).toBe(true)

    const conJoven = tablero('M..............', {
      1: formula(perfil('Mujer', { esJoven: true })),
    })
    expect(repartoNecesario(ambitoDe(conJoven)).faltaJoven).toBe(false)
  })

  it('en un tablero de once dice qué no pudo resolver, y aun así propone', () => {
    // El 28.5 exige mayoría femenina en el bloque bajo mientras el 28.2 le
    // cierra la posición que haría falta: ningún acomodo cumple los dos.
    const once = retirar(tablero('...............'), [3, 8, 13, 15])
    const reparto = repartoNecesario(ambitoDe(once))

    expect(reparto.porDistrito.size).toBe(11)
    expect(reparto.irresolubles.length).toBeGreaterThan(0)
    // Se coloca el reparto más cercano: reporta, no se planta.
    expect(reparto.faltan.Mujer + reparto.faltan.Hombre).toBe(11)
  })

  it('cuadra el conteo por género con la propuesta distrito a distrito', () => {
    const reparto = repartoNecesario(ambitoDe(tablero('..M..H.........')))
    const contadas = { Mujer: 0, Hombre: 0 }
    for (const genero of reparto.porDistrito.values()) contadas[genero] += 1

    expect(contadas).toEqual(reparto.faltan)
  })
})

// ─── No postular fuera del convenio (artículo 27) ───────────────────────────

/** Un integrante declina contender en unos distritos que el convenio no abarca. */
function declinar(
  distritos: DistritoActivo[],
  partido: IdPartido,
  posiciones: number[],
): DistritoActivo[] {
  return distritos.map((d) => {
    if (!posiciones.includes(d.posicion_rentabilidad)) return d
    if (d.postulacion.modo !== 'fuera') throw new Error('Ese distrito no está fuera del convenio')
    return {
      ...d,
      postulacion: {
        modo: 'fuera',
        formulas: { ...d.postulacion.formulas, [partido]: 'sin-postular' as const },
      },
    }
  })
}

/** Coalición parcial PAN-PRI: doce distritos en el convenio y tres fuera. */
function parcial(): { alianza: Postulante; distritos: DistritoActivo[] } {
  const alianza = coalicion(PARTIDO.PRI, PARTIDO.PAN)
  return {
    alianza,
    distritos: repartir(tablero('MHHHHHHH MMMMMMM', {}, alianza), (p) =>
      p > 12 ? 'fuera' : p <= 6 ? PARTIDO.PRI : PARTIDO.PAN,
    ),
  }
}

function tableroDe(distritos: DistritoActivo[], alianza: Postulante, partido: IdPartido): Ambito {
  const encontrado = ambitosDe(simulacion(distritos, [], alianza)).find(
    (a) => a.tipo === 'tablero' && a.fuera && a.partido === partido,
  )
  if (!encontrado) throw new Error(`${siglasDe(partido)} no tiene tablero individual`)
  return encontrado
}

describe('no postular fuera del convenio', () => {
  it('saca el distrito del tablero del integrante que declina', () => {
    const { alianza, distritos } = parcial()
    expect(tableroDe(distritos, alianza, PARTIDO.PRI).distritos).toHaveLength(3)

    const sinUno = declinar(distritos, PARTIDO.PRI, [14])
    expect(tableroDe(sinUno, alianza, PARTIDO.PRI).distritos).toHaveLength(2)
  })

  it('no toca al aliado, que sigue postulando ahí', () => {
    const { alianza, distritos } = parcial()
    const sinUno = declinar(distritos, PARTIDO.PRI, [14])
    const delPAN = tableroDe(sinUno, alianza, PARTIDO.PAN)

    expect(delPAN.distritos).toHaveLength(3)
    expect(declinaPostular(sinUno[13].postulacion, PARTIDO.PAN)).toBe(false)
  })

  it('rehace los bloques con los distritos que quedan, no con los de antes', () => {
    // Artículo 27.1.1: el orden se integra con aquellos en los que sí se postula.
    const { alianza, distritos } = parcial()
    const sinUno = declinar(distritos, PARTIDO.PRI, [14])
    const propio = tableroDe(sinUno, alianza, PARTIDO.PRI)

    expect(propio.distritos.map((d) => d.posicion_rentabilidad)).toEqual([1, 2])
    expect(propio.distritos.map((d) => d.bloque)).toEqual(['Alta', 'Media'])
  })

  it('deja de contarlo en la paridad global del partido', () => {
    const { alianza, distritos } = parcial()
    const consolidado = (ds: DistritoActivo[]) =>
      ambitosDe(simulacion(ds, [], alianza)).find(
        (a) => a.tipo === 'consolidado' && a.partido === PARTIDO.PRI,
      )!

    expect(consolidado(distritos).distritos).toHaveLength(9)
    expect(consolidado(declinar(distritos, PARTIDO.PRI, [13, 14])).distritos).toHaveLength(7)
  })

  it('el convenio no se entera: sigue abarcando los mismos doce', () => {
    const { alianza, distritos } = parcial()
    const sinDos = declinar(distritos, PARTIDO.PRI, [13, 14])
    const convenio = ambitosDe(simulacion(sinDos, [], alianza)).find(
      (a) => a.tipo === 'tablero' && !a.fuera,
    )!

    expect(convenio.distritos).toHaveLength(12)
  })

  it('la negativa no se confunde con una fórmula', () => {
    const { distritos } = parcial()
    const sinUno = declinar(distritos, PARTIDO.PRI, [14])
    const conFormula = formulasEnDistrito(distritos[13].postulacion)

    expect(formulasEnDistrito(sinUno[13].postulacion)).toEqual(conFormula)
    expect(formulasEnDistrito(sinUno[13].postulacion).every((f) => 'propietario' in f)).toBe(true)
  })
})
