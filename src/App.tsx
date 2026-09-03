import { useState } from 'react'
import { AnimatePresence, m } from 'motion/react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { siglasDe } from './domain/catalogo'
import { aparicion, contenedor, paso } from './lib/animacion'
import type { TokenFormula } from './domain/types'
import { useEsEscritorio } from './lib/media'
import { useSimulador } from './store/simulador'
import { leerDestino, leerOrigen } from './components/arrastre'
import { Bandeja } from './components/Bandeja'
import { ConfiguracionPostulante } from './components/ConfiguracionPostulante'
import { Consideraciones } from './components/Consideraciones'
import { DialogoRebote } from './components/DialogoRebote'
import { EmblemaInstituto } from './components/EmblemaInstituto'
import { CajaDistrito, FaseConvenio } from './components/FaseConvenio'
import { FaseMayoria } from './components/FaseMayoria'
import { FaseProporcional } from './components/FaseProporcional'
import { FichaFormula } from './components/FichaFormula'
import { ModalConfiguracion } from './components/ModalConfiguracion'
import { PanelBalance } from './components/PanelBalance'
import { PanelDictamen } from './components/PanelDictamen'
import { SelectorTema } from './components/SelectorTema'
import { Badge } from './components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'

const FASES = [
  { valor: 'convenio', etiqueta: '1 · Convenio' },
  { valor: 'mayoria', etiqueta: '2 · Mayoría relativa' },
  { valor: 'proporcional', etiqueta: '3 · Lista "A"' },
] as const

function App() {
  const arrastre = useEsEscritorio()
  const [fase, setFase] = useState<string>('convenio')
  const [direccion, setDireccion] = useState(1)
  const [activo, setActivo] = useState<string | null>(null)
  const [aceptado, setAceptado] = useState(false)

  // El sentido del movimiento sale del orden de las fases, no de qué pestaña se
  // pulsó: saltar de la 1 a la 3 sigue siendo avanzar.
  function cambiarFase(valor: string) {
    const desde = FASES.findIndex((f) => f.valor === fase)
    const hasta = FASES.findIndex((f) => f.valor === valor)
    setDireccion(hasta < desde ? -1 : 1)
    setFase(valor)
  }

  const postulante = useSimulador((s) => s.postulante)
  const distritos = useSimulador((s) => s.distritos)
  const listasRP = useSimulador((s) => s.listasRP)
  const bandeja = useSimulador((s) => s.bandeja)
  const siglar = useSimulador((s) => s.siglar)
  const asignarMR = useSimulador((s) => s.asignarMR)
  const asignarRP = useSimulador((s) => s.asignarRP)
  const devolverABandeja = useSimulador((s) => s.devolverABandeja)

  // Un umbral de arrastre evita que el clic en la "x" de una ficha se
  // interprete como el inicio de un movimiento.
  const sensores = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  function formulaPorId(id: string): TokenFormula | undefined {
    const enDistritos = distritos.flatMap((d) => {
      const { postulacion } = d
      if (postulacion.modo === 'convenio') return postulacion.formula ? [postulacion.formula] : []
      if (postulacion.modo === 'fuera') return Object.values(postulacion.formulas)
      return []
    })
    return (
      bandeja.find((f) => f.id === id) ??
      enDistritos.find((f) => f?.id === id) ??
      listasRP.flatMap((l) => l.posiciones).find((f) => f?.id === id) ??
      undefined
    )
  }

  function alSoltar(evento: DragEndEvent) {
    setActivo(null)
    if (!evento.over) return
    const origen = leerOrigen(String(evento.active.id))
    const destino = leerDestino(String(evento.over.id))
    if (!destino) return

    if (origen.tipo === 'distrito') {
      // Los distritos solo se mueven entre columnas del convenio.
      if (destino.tipo === 'siglado') siglar(origen.id_distrito, destino.destino)
      return
    }

    if (destino.tipo === 'bandeja') devolverABandeja(origen.id)
    else if (destino.tipo === 'mr') asignarMR(origen.id, destino.id_distrito, destino.partido)
    else if (destino.tipo === 'rp') asignarRP(origen.id, destino.partido, destino.posicion)
  }

  const arrastrado = activo ? leerOrigen(activo) : null
  const distritoArrastrado =
    arrastrado?.tipo === 'distrito'
      ? distritos.find((d) => d.id_distrito === arrastrado.id_distrito)
      : undefined
  const formulaArrastrada = arrastrado?.tipo === 'formula' ? formulaPorId(arrastrado.id) : undefined

  return (
    <DndContext
      sensors={sensores}
      onDragStart={(e: DragStartEvent) => setActivo(String(e.active.id))}
      onDragCancel={() => setActivo(null)}
      onDragEnd={alSoltar}
    >
      {/*
        Encabezado a sangre, separado del tablero por una regla: el emblema es
        de la institución y el simulador es una herramienta suya, así que la
        franja superior se lee como membrete y no como parte del tablero.
      */}
      <header className="border-b">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 p-4 lg:px-6">
          <EmblemaInstituto />
          {/* Separa dos identidades: la del Instituto y la del producto. */}
          <div className="bg-border hidden h-10 w-px sm:block" />
          <div className="min-w-0">
            {/* Sin `truncate`: en móvil el título se parte en dos líneas antes
                que mostrar «Simulador de Postul…», que no identifica nada. */}
            <h1 className="text-lg font-semibold tracking-tight text-balance sm:text-xl">
              Simulador de Postulaciones Electorales
            </h1>
            <p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
              Proceso Electoral Local 2026-2027
            </p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            {postulante && (
              <Badge variant="outline">
                {postulante.modalidad} · {postulante.integrantes.map(siglasDe).join('-')}
              </Badge>
            )}
            <SelectorTema />
            <ModalConfiguracion />
          </div>
        </div>
      </header>

      {/* Sin ancho máximo: el tablero aprovecha todo el monitor. */}
      <main className="p-4 lg:p-6">
        {/*
          Dos puertas antes del tablero. Primero las consideraciones, que hay que
          leer antes de tocar nada; después el postulante, porque sin él no hay
          nada que dictaminar y el resto de la interfaz sería ruido —o peor, un
          tablero con un partido que nadie eligió—.
        */}
        <AnimatePresence mode="wait">
        {!aceptado ? (
          <m.div
            key="consideraciones"
            variants={aparicion}
            initial="oculto"
            animate="visible"
            exit="saliente"
            className="pt-8"
          >
            <Consideraciones onAceptar={() => setAceptado(true)} />
          </m.div>
        ) : !postulante ? (
          <m.div
            key="postulante"
            variants={aparicion}
            initial="oculto"
            animate="visible"
            exit="saliente"
            className="mx-auto max-w-md pt-8"
          >
            <ConfiguracionPostulante />
            <p className="text-muted-foreground mt-4 text-center text-xs">
              El simulador trabaja con fórmulas anónimas. No captura nombres de personas en
              ningún momento.
            </p>
          </m.div>
        ) : (
        /*
          Tres columnas en pantallas anchas: dictamen a la izquierda, tablero al
          centro —el más ancho, porque es donde se trabaja— y herramientas a la
          derecha. La colocación es explícita con `col-start`, no por orden de
          aparición: así el orden del DOM puede seguir siendo el de lectura
          —primero el tablero, luego las herramientas, al final el dictamen—, que
          es el que se aplica cuando las columnas se apilan.
        */
        <m.div
          key="tablero"
          variants={contenedor}
          initial="oculto"
          animate="visible"
          exit="saliente"
          className="grid items-start gap-5 xl:grid-cols-[340px_minmax(0,1fr)_360px]"
        >
          {/*
            El orden de la columna es el del trabajo: primero se elige el paso,
            luego se mueven las fórmulas, y el balance cierra abajo porque se
            lee después de actuar, no antes.
          */}
          <m.div
            variants={aparicion}
            className="min-w-0 space-y-4 xl:col-start-2 xl:row-start-1"
          >
            <Tabs value={fase} onValueChange={(v) => cambiarFase(String(v))}>
              <TabsList>
                {FASES.map((f) => (
                  <TabsTrigger key={f.valor} value={f.valor}>
                    {f.etiqueta}
                  </TabsTrigger>
                ))}
              </TabsList>
              <TabsContent value="convenio" className="pt-2">
                <m.div custom={direccion} variants={paso} initial="entra" animate="centro">
                  <FaseConvenio arrastre={arrastre} />
                </m.div>
              </TabsContent>
              <TabsContent value="mayoria" className="pt-2">
                <m.div custom={direccion} variants={paso} initial="entra" animate="centro">
                  <FaseMayoria arrastre={arrastre} />
                </m.div>
              </TabsContent>
              <TabsContent value="proporcional" className="pt-2">
                <m.div custom={direccion} variants={paso} initial="entra" animate="centro">
                  <FaseProporcional arrastre={arrastre} />
                </m.div>
              </TabsContent>
            </Tabs>
            <PanelBalance />
          </m.div>

          <m.aside variants={aparicion} className="space-y-4 xl:col-start-3 xl:row-start-1">
            <ConfiguracionPostulante />
            {/* La bandeja no existe en la Fase 1: no hay fórmulas que repartir. */}
            <AnimatePresence>
              {fase !== 'convenio' && (
                <m.div
                  variants={aparicion}
                  initial="oculto"
                  animate="visible"
                  exit="saliente"
                >
                  <Bandeja arrastre={arrastre} />
                </m.div>
              )}
            </AnimatePresence>
          </m.aside>

          <m.aside variants={aparicion} className="xl:col-start-1 xl:row-start-1">
            <PanelDictamen />
          </m.aside>
        </m.div>
        )}
        </AnimatePresence>
      </main>

      <DragOverlay>
        {distritoArrastrado && <CajaDistrito distrito={distritoArrastrado} />}
        {formulaArrastrada && <FichaFormula formula={formulaArrastrada} asidero />}
      </DragOverlay>

      <DialogoRebote />
    </DndContext>
  )
}

export default App
