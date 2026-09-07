import { Document, Font, Image, Page, Text, View } from '@react-pdf/renderer'
import { siglasDe } from '@/domain/catalogo'
import type { GeneroParidad, IdPartido, TokenFormula } from '../domain/types'
import { GRUPOS } from '@/domain/reglas'
import { cuotasAcreditadas } from '../lib/formula'
import { ROTULO_GRUPO } from '../lib/rotulos'
import type { Dossier, ListaImpresa, TableroImpreso } from './dossier'
import { estilos as construirEstilos, type Estilos } from './estilos'
import type { Recursos } from './recursos'

// Sin partición de palabras. La de serie está pensada para el inglés y en
// español corta donde no debe —«candidat-uras»—, que en un documento que cita
// artículos se lee como una errata. Va junto a la composición y no junto a la
// carga de recursos: es una decisión de este documento, no de sus archivos.
Font.registerHyphenationCallback((palabra) => [palabra])

const INSTITUTO = 'Instituto Electoral y de Participación Ciudadana del Estado de Durango'
const UNIDAD = 'Unidad Técnica de Cómputo'

const ABREVIATURA: Record<string, string> = {
  Mujer: 'M',
  Hombre: 'H',
  'No Binario': 'NB',
}

/**
 * La fórmula se imprime en dos columnas rotuladas, no como «M → H».
 *
 * La flecha no está en la codificación de las tipografías de serie del PDF y
 * salía como un apóstrofo. Nombrar las dos columnas es además lo correcto en un
 * documento que cita el artículo 5: la propietaria y la suplente son cargos con
 * nombre, no los extremos de una flecha.
 */
function genero(perfil: TokenFormula['propietario']): string {
  return ABREVIATURA[perfil.genero]
}

function fechaLarga(momento: Date): string {
  const dia = momento.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  // En veinticuatro horas: con `hour12` el rótulo salía «09:11 p. m. h».
  const hora = momento.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  // Con la hora, no solo el día: un mismo escenario se regenera varias veces en
  // una jornada y cada documento tiene que poder distinguirse de sí mismo.
  return `${dia}, ${hora} h`
}

/**
 * El membrete. Va `fixed`, así que `react-pdf` lo repite en cada hoja sin que
 * el cuerpo tenga que saber cuántas son.
 */
function Membrete({
  estilos,
  recursos,
  fecha,
}: {
  estilos: Estilos
  recursos: Recursos
  fecha: Date
}) {
  return (
    <View style={estilos.encabezado} fixed>
      {recursos.logotipo ? (
        <Image src={recursos.logotipo} style={estilos.logotipo} />
      ) : (
        <Text style={estilos.titulo}>IEPC Durango</Text>
      )}
      <View style={estilos.divisor} />
      <View>
        <Text style={estilos.titulo}>Simulador de Postulaciones Electorales</Text>
        <Text style={estilos.subtitulo}>Proceso Electoral Local 2026-2027</Text>
      </View>
      <Text style={estilos.fecha}>{fechaLarga(fecha)}</Text>
    </View>
  )
}

function Pie({ estilos }: { estilos: Estilos }) {
  return (
    <View style={estilos.pie} fixed>
      <View style={estilos.pieIzquierda}>
        <Text>{INSTITUTO}</Text>
        <Text>{UNIDAD}</Text>
      </View>
      <Text style={estilos.pieCentro}>
        Este sistema es una herramienta didáctica que{' '}
        <Text style={estilos.destacado}>NO</Text> sustituye la revisión que se hará al momento del
        registro de candidaturas.
      </Text>
      {/*
        `fixed` va también en el propio `Text`, no solo en el contenedor: sin él
        `react-pdf` resuelve el `render` una vez y la línea sale vacía.
      */}
      <Text
        fixed
        style={estilos.pieDerecha}
        render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
      />
    </View>
  )
}

/**
 * El emblema de un partido, si su archivo está disponible.
 *
 * Solo acompaña a los rótulos donde un partido es **sujeto** —el título de su
 * tablero, su renglón en el convenio—, nunca dentro de las tablas: a ocho puntos
 * un emblema por celda no aporta información y sí ruido. Es la misma distinción
 * que la pantalla hace entre `EtiquetaPartido` y `EmblemasDe`.
 */
function Emblema({
  partido,
  recursos,
  estilos,
  chico,
}: {
  partido: IdPartido
  recursos: Recursos
  estilos: Estilos
  /** Ceñido al cuerpo de 8 puntos, para dentro de una tabla. */
  chico?: boolean
}) {
  const fuente = recursos.emblemas[partido]
  if (!fuente) return null
  return <Image src={fuente} style={chico ? estilos.emblemaChico : estilos.emblema} />
}

/** Varios emblemas seguidos: el convenio de una alianza, o un ámbito conjunto. */
function Emblemas({
  partidos,
  recursos,
  estilos,
  chico,
}: {
  partidos: readonly IdPartido[]
  recursos: Recursos
  estilos: Estilos
  chico?: boolean
}) {
  return (
    <>
      {partidos.map((partido) => (
        <Emblema
          key={partido}
          partido={partido}
          recursos={recursos}
          estilos={estilos}
          chico={chico}
        />
      ))}
    </>
  )
}

function Ficha({ rotulo, valor, estilos }: { rotulo: string; valor: string; estilos: Estilos }) {
  return (
    <View style={estilos.ficha}>
      <Text style={estilos.fichaRotulo}>{rotulo}</Text>
      <Text style={estilos.fichaValor}>{valor}</Text>
    </View>
  )
}

// ─── El tablero ──────────────────────────────────────────────────────────────

const COL = {
  posicion: { width: '6%', paddingRight: 4 },
  distrito: { width: '7%', paddingRight: 4 },
  votacion: { width: '11%', textAlign: 'right' as const, paddingRight: 9 },
  siglado: { width: '10%', paddingRight: 4 },
  propietaria: { width: '11%', paddingRight: 4 },
  suplente: { width: '11%', paddingRight: 6 },
  acredita: { flex: 1 },
}

function Tablero({
  tablero,
  estilos,
  recursos,
  enAlianza,
}: {
  tablero: TableroImpreso
  estilos: Estilos
  recursos: Recursos
  enAlianza: boolean
}) {
  const hayCerradas = tablero.bloques.some((b) => b.distritos.some((d) => d.esBlindada))
  const total = tablero.bloques.reduce((n, b) => n + b.distritos.length, 0)
  // La cabecera cede ancho cuando hay una columna más que acomodar.
  const colCabecera = { width: tablero.conSiglado ? '20%' : '26%', paddingRight: 6 }

  // Tres casos, no dos: quien compite solo no suma con nadie.
  const procedencia = tablero.fuera
    ? 'ranking propio del partido, con su porcentaje individual de la elección 2023-2024'
    : enAlianza
      ? 'ranking de la postulación conjunta, con la suma de los porcentajes de sus integrantes'
      : 'ranking del Partido Político, con su porcentaje de la elección 2023-2024'

  return (
    <View style={estilos.seccion} break={false}>
      <View style={[estilos.rubro, estilos.rubroConEmblema]}>
        <Emblemas partidos={tablero.partidos} recursos={recursos} estilos={estilos} />
        <Text>{tablero.partido}</Text>
      </View>
      <Text style={estilos.nota}>
        {total} distrito(s) · {procedencia}
      </Text>

      {tablero.bloques.map(({ bloque, distritos }) => (
        <View key={bloque} wrap={false}>
          <Text style={estilos.subrubro}>
            Bloque {bloque} · {distritos.length} distrito(s)
          </Text>
          {distritos.length === 0 ? (
            <Text style={estilos.nota}>Sin distritos en este bloque.</Text>
          ) : (
            <>
              <View style={estilos.cabecera}>
                <Text style={COL.posicion}>Pos.</Text>
                <Text style={COL.distrito}>Dto.</Text>
                <Text style={colCabecera}>Cabecera</Text>
                <Text style={COL.votacion}>Votación</Text>
                {tablero.conSiglado && <Text style={COL.siglado}>Siglado</Text>}
                <Text style={COL.propietaria}>Propietaria</Text>
                <Text style={COL.suplente}>Suplente</Text>
                <Text style={COL.acredita}>Acredita</Text>
              </View>
              {distritos.map((distrito) => {
                const formula = distrito.formula_asignada
                const cuotas = formula ? cuotasAcreditadas(formula) : []
                return (
                  <View key={distrito.id_distrito} style={estilos.fila}>
                    <Text style={COL.posicion}>
                      {distrito.posicion_rentabilidad}
                      {distrito.esBlindada ? ' *' : ''}
                    </Text>
                    <Text style={[COL.distrito, estilos.destacado]}>{distrito.numero_romano}</Text>
                    <Text style={colCabecera}>{distrito.cabecera}</Text>
                    <Text style={COL.votacion}>{distrito.porcentaje.toFixed(2)}%</Text>
                    {tablero.conSiglado && (
                      <View style={[COL.siglado, estilos.celdaConEmblema]}>
                        {distrito.siglado !== null ? (
                          <>
                            <Emblema
                              partido={distrito.siglado}
                              recursos={recursos}
                              estilos={estilos}
                              chico
                            />
                            <Text>{siglasDe(distrito.siglado)}</Text>
                          </>
                        ) : (
                          <Text>—</Text>
                        )}
                      </View>
                    )}
                    <Text style={[COL.propietaria, estilos.destacado]}>
                      {formula ? genero(formula.propietario) : '—'}
                    </Text>
                    <Text style={[COL.suplente, estilos.destacado]}>
                      {formula ? genero(formula.suplente) : '—'}
                    </Text>
                    <Text style={[COL.acredita, cuotas.length ? {} : estilos.tenue]}>
                      {cuotas.length ? cuotas.join(' · ') : 'Sin medida compensatoria'}
                    </Text>
                  </View>
                )
              })}
            </>
          )}
        </View>
      ))}

      {hayCerradas && (
        <Text style={estilos.nota}>
          * Posición de menor porcentaje de votación del ámbito: no admite fórmulas encabezadas por
          mujeres (artículo 28, numeral 2 de los Lineamientos).
        </Text>
      )}

      {tablero.retirados.length > 0 && (
        <>
          <Text style={estilos.subrubro}>No se postula en {tablero.retirados.length} distrito(s)</Text>
          <Text style={estilos.nota}>
            {tablero.retirados.map((d) => `${d.numero_romano} ${d.cabecera}`).join(' · ')}. Los
            bloques de competitividad se integran con los distritos en los que sí se postula
            (artículo 27, numeral 1 de los Lineamientos).
          </Text>
        </>
      )}
    </View>
  )
}

// ─── Lista "A" ───────────────────────────────────────────────────────────────

function Lista({
  lista,
  estilos,
  recursos,
}: {
  lista: ListaImpresa
  estilos: Estilos
  recursos: Recursos
}) {
  return (
    <View wrap={false} style={{ marginBottom: 10 }}>
      <View style={[estilos.subrubro, estilos.rubroConEmblema]}>
        <Emblema partido={lista.partido} recursos={recursos} estilos={estilos} />
        <Text>Lista &laquo;A&raquo; de {lista.nombre}</Text>
      </View>
      <View style={estilos.cabecera}>
        <Text style={{ width: '12%', paddingRight: 4 }}>Pos.</Text>
        <Text style={{ width: '15%', paddingRight: 4 }}>Propietaria</Text>
        <Text style={{ width: '15%', paddingRight: 6 }}>Suplente</Text>
        <Text style={{ flex: 1 }}>Acredita</Text>
      </View>
      {lista.posiciones.map((formula, i) => {
        const cuotas = formula ? cuotasAcreditadas(formula) : []
        return (
          <View key={i} style={estilos.fila}>
            <Text style={{ width: '12%', paddingRight: 4 }}>{i + 1}</Text>
            <Text style={[{ width: '15%', paddingRight: 4 }, estilos.destacado]}>
              {formula ? genero(formula.propietario) : '—'}
            </Text>
            <Text style={[{ width: '15%', paddingRight: 6 }, estilos.destacado]}>
              {formula ? genero(formula.suplente) : '—'}
            </Text>
            <Text style={[{ flex: 1 }, cuotas.length ? {} : estilos.tenue]}>
              {cuotas.length ? cuotas.join(' · ') : 'Sin medida compensatoria'}
            </Text>
          </View>
        )
      })}
    </View>
  )
}

// ─── El documento ────────────────────────────────────────────────────────────

export function Dictamen({ dossier, recursos }: { dossier: Dossier; recursos: Recursos }) {
  const estilos = construirEstilos(recursos.familia)
  const { postulante, convenio, recuento } = dossier
  const generos: GeneroParidad[] = ['Mujer', 'Hombre']

  return (
    <Document
      title="Resultado de la simulación de postulaciones"
      author={INSTITUTO}
      subject="Proceso Electoral Local 2026-2027, Durango"
      creator="Simulador de Postulaciones Electorales"
    >
      <Page size="LETTER" style={estilos.pagina}>
        <Membrete estilos={estilos} recursos={recursos} fecha={dossier.generado} />
        <Pie estilos={estilos} />

        {/* ── Identificación ── */}
        <View>
          <Text style={estilos.rubro}>Resultado de la simulación</Text>
          <Ficha rotulo="Modalidad" valor={postulante.modalidad} estilos={estilos} />
          <View style={estilos.ficha}>
            <Text style={estilos.fichaRotulo}>
              {postulante.solo ? 'Partido Político' : 'Integrantes'}
            </Text>
            <View style={{ flex: 1 }}>
              {postulante.integrantes.map((p) => (
                <View key={p.id} style={estilos.celdaConEmblema}>
                  <Emblema partido={p.id} recursos={recursos} estilos={estilos} />
                  <Text style={estilos.destacado}>{p.nombre}</Text>
                  <Text style={estilos.tenue}>{p.siglas}</Text>
                </View>
              ))}
            </View>
          </View>
          <Ficha rotulo="Generado" valor={fechaLarga(dossier.generado)} estilos={estilos} />
{/*          <Text style={estilos.nota}>
            La simulación cumple las {dossier.reglasVerificadas} reglas verificadas por el motor de validación. El
            sistema trabaja con fórmulas anónimas, definidas solo por tres atributos jurídicos:
            género, edad y medida compensatoria. No captura ni almacena nombres de personas.
          </Text>*/}
        </View>

        {/* ── Convenio ── */}
        {convenio && (
          <View style={estilos.seccion} wrap={false}>
            <Text style={estilos.rubro}>Integración del convenio</Text>
            <Ficha rotulo="Alcance" valor={`Coalición ${convenio.clase}`} estilos={estilos} />
            <View style={estilos.ficha}>
              <Text style={estilos.fichaRotulo}>Siglados</Text>
              <View style={{ flex: 1 }}>
                <Text style={estilos.destacado}>{convenio.siglados} distrito(s)</Text>
                {postulante.integrantes.map((integrante, i) => (
                  <View key={integrante.id} style={estilos.celdaConEmblema}>
                    <Emblema partido={integrante.id} recursos={recursos} estilos={estilos} />
                    <Text>
                      {integrante.nombre}: {convenio.porPartido[i]?.distritos ?? 0} distrito(s)
                    </Text>
                  </View>
                ))}
              </View>
            </View>
            <Ficha
              rotulo="Fuera"
              valor={`${convenio.fuera} distrito(s), que cada integrante postula por su cuenta`}
              estilos={estilos}
            />
            {convenio.sinPostular > 0 && (
              <Ficha
                rotulo="Sin postular"
                valor={`${convenio.sinPostular} distrito(s)`}
                estilos={estilos}
              />
            )}
          </View>
        )}

        {/* ── Tableros ── */}
        {dossier.tableros.map((tablero) => (
          <Tablero
            key={tablero.etiqueta}
            tablero={tablero}
            estilos={estilos}
            recursos={recursos}
            enAlianza={!postulante.solo}
          />
        ))}

        {/* ── Lista "A" ── */}
        {dossier.listas.length > 0 && (
          <View style={estilos.seccion}>
            <Text style={estilos.rubro}>Representación proporcional</Text>
            {dossier.listas.map((lista) => (
              <Lista
                key={lista.partido}
                lista={lista}
                estilos={estilos}
                recursos={recursos}
              />
            ))}
          </View>
        )}

        {/* ── Estadísticas ── */}
        <View style={estilos.seccion}>
          <Text style={estilos.rubro}>Balance de la postulación</Text>

          <Text style={estilos.subrubro}>Paridad por ámbito</Text>
          <View style={estilos.cabecera}>
            <Text style={{ flex: 1 }}>Ámbito</Text>
            <Text style={{ width: '13%', textAlign: 'right' }}>Mujeres</Text>
            <Text style={{ width: '13%', textAlign: 'right' }}>Hombres</Text>
            <Text style={{ width: '13%', textAlign: 'right' }}>Total</Text>
            <Text style={{ width: '13%', textAlign: 'right' }}>Mínimo</Text>
          </View>
          {recuento.paridad.map((fila) => (
            <View key={fila.ambito} style={estilos.fila}>
              <View style={[{ flex: 1, paddingRight: 6 }, estilos.celdaConEmblema]}>
                {/* Sin partido propio es el convenio: van los de toda la alianza. */}
                <Emblemas
                  partidos={fila.partido !== null ? [fila.partido] : postulante.integrantes.map((p) => p.id)}
                  recursos={recursos}
                  estilos={estilos}
                  chico
                />
                <Text>{fila.ambito}</Text>
              </View>
              <Text style={{ width: '13%', textAlign: 'right' }}>{fila.mujeres}</Text>
              <Text style={{ width: '13%', textAlign: 'right' }}>{fila.hombres}</Text>
              <Text style={{ width: '13%', textAlign: 'right' }}>{fila.total}</Text>
              <Text style={[{ width: '13%', textAlign: 'right' }, estilos.tenue]}>
                {fila.minimo ?? '—'}
              </Text>
            </View>
          ))}
          <Text style={estilos.nota}>
            El mínimo es el 50% de fórmulas encabezadas por mujeres que exige el artículo 23,
            numeral 1. Un "-" señala el ámbito que no responde por su paridad propia, porque la
            verifica el conjunto de la coalición (artículo 20, numeral 2).
          </Text>

          <Text style={estilos.subrubro}>Quién encabeza las fórmulas</Text>
          <View style={estilos.cabecera}>
            <Text style={{ flex: 1 }}>Principio</Text>
            {generos.map((g) => (
              <Text key={g} style={{ width: '16%', textAlign: 'right' }}>
                {g}
              </Text>
            ))}
            <Text style={{ width: '16%', textAlign: 'right' }}>Fórmulas</Text>
            <Text style={{ width: '18%', textAlign: 'right' }}>Candidaturas</Text>
          </View>
          {(
            [
              ['Mayoría relativa', recuento.mayoria],
              ['Representación proporcional', recuento.proporcional],
            ] as const
          ).map(([rotulo, r]) => (
            <View key={rotulo} style={estilos.fila}>
              <Text style={{ flex: 1 }}>{rotulo}</Text>
              {generos.map((g) => (
                <Text key={g} style={{ width: '16%', textAlign: 'right' }}>
                  {r.encabezan[g]}
                </Text>
              ))}
              <Text style={{ width: '16%', textAlign: 'right' }}>{r.formulas}</Text>
              <Text style={{ width: '18%', textAlign: 'right' }}>{r.candidaturas}</Text>
            </View>
          ))}
          <Text style={estilos.nota}>
            Se cuenta por quien encabeza la fórmula, que es la persona propietaria. Los perfiles no
            binarios se cuentan del lado de los hombres para efectos de paridad, conforme al criterio
            que evita que una acción afirmativa desplace el piso del género subrepresentado.
          </Text>

          <Text style={estilos.subrubro}>Medidas compensatorias</Text>
          <View style={estilos.cabecera}>
            <Text style={{ flex: 1 }}>Grupo</Text>
            <Text style={{ width: '18%', textAlign: 'right' }}>Fórmulas MR</Text>
            <Text style={{ width: '18%', textAlign: 'right' }}>Fórmulas RP</Text>
            <Text style={{ width: '22%', textAlign: 'right' }}>Sin acreditar</Text>
          </View>
          {GRUPOS.map((grupo) => {
            const mr = recuento.mayoria.grupos.find((g) => g.grupo === grupo)
            const rp = recuento.proporcional.grupos.find((g) => g.grupo === grupo)
            const sueltas = (mr?.sinAcreditar ?? 0) + (rp?.sinAcreditar ?? 0)
            return (
              <View key={grupo} style={estilos.fila}>
                <Text style={{ flex: 1 }}>{ROTULO_GRUPO[grupo]}</Text>
                <Text style={{ width: '18%', textAlign: 'right' }}>{mr?.formulas ?? 0}</Text>
                <Text style={{ width: '18%', textAlign: 'right' }}>{rp?.formulas ?? 0}</Text>
                <Text style={[{ width: '22%', textAlign: 'right' }, estilos.tenue]}>{sueltas}</Text>
              </View>
            )
          })}
          <Text style={estilos.nota}>
            Una fórmula acredita la medida solo cuando la persona propietaria y la suplente
            pertenecen al mismo grupo (artículo 5, fracción XV). «Sin acreditar» son las personas del
            grupo cuya fórmula no la acredita: la candidatura es válida y se registra, pero no cuenta
            para la medida.
          </Text>
        </View>

        {/* ── Dictamen ── */}
        <View style={estilos.seccion}>
          <Text style={estilos.rubro}>Verificación</Text>
          <Text style={estilos.parrafo}>
            Se verificaron {dossier.reglasVerificadas} reglas sobre {dossier.ambitosEvaluados}{' '}
            ámbitos de evaluación, y todas se cumplen. Un ámbito es un tablero con sus bloques
            propios, el registro consolidado de un partido o una Lista &laquo;A&raquo;. El detalle
            va por regla, con el fundamento que la sostiene y el hallazgo de cada ámbito.
          </Text>
          {dossier.dictamen.map((grupo) => (
            <View key={grupo.regla} style={{ marginBottom: 9 }} wrap={false}>
              <Text style={estilos.subrubro}>{grupo.regla}</Text>
              {grupo.hallazgos.map((hallazgo) => (
                <View key={hallazgo.alcance} style={estilos.hallazgo}>
                  <View style={[estilos.hallazgoAmbito, estilos.celdaConEmblemaAlta]}>
                    <Emblemas
                      partidos={hallazgo.partidos}
                      recursos={recursos}
                      estilos={estilos}
                      chico
                    />
                    <Text style={{ flex: 1 }}>{hallazgo.alcance}</Text>
                  </View>
                  <Text style={estilos.hallazgoMensaje}>{hallazgo.mensaje}</Text>
                </View>
              ))}
              <Text style={estilos.nota}>{grupo.fundamento}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  )
}
