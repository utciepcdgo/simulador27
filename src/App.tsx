import { useState } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { IconArrowRight } from '@tabler/icons-react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { aparicion, contenedor, paso } from './lib/animacion'
import type { TokenFormula } from './domain/types'
import { useEsEscritorio } from './lib/media'
import { useConfiguracion } from './store/configuracion'
import { useSimulador } from './store/simulador'
import { leerDestino, leerOrigen } from './components/arrastre'
import { Bandeja } from './components/Bandeja'
import { ControlesLlenado } from './components/ControlesLlenado'
import { ConfiguracionPostulante } from './components/ConfiguracionPostulante'
import { Consideraciones } from './components/Consideraciones'
import { AvisoCierre } from './components/AvisoCierre'
import { DialogoRebote } from './components/DialogoRebote'
import { TramaProyecto } from './components/TramaProyecto'
import { EmblemaInstituto } from './components/EmblemaInstituto'
import { EtiquetaPartido } from './components/EtiquetaPartido'
import { CajaDistrito, FaseConvenio } from './components/FaseConvenio'
import { FaseMayoria } from './components/FaseMayoria'
import { FaseProporcional } from './components/FaseProporcional'
import { FichaFormula } from './components/FichaFormula'
import { FondoMica } from './components/FondoMica'
import { ModalConfiguracion } from './components/ModalConfiguracion'
import { PanelBalance } from './components/PanelBalance'
import { PanelDictamen } from './components/PanelDictamen'
import { SelectorTema } from './components/SelectorTema'
import { Tutorial } from './components/tutorial/Tutorial'
import { Badge } from './components/ui/badge'
import { Button } from './components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from './components/ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { formulasEnDistrito } from './domain/reglas'
import type { Postulante } from './domain/types'

const FASES = [
  { valor: 'convenio', etiqueta: '1 · Convenio', corto: 'Convenio' },
  { valor: 'mayoria', etiqueta: '2 · Mayoría relativa', corto: 'Mayoría relativa' },
  { valor: 'proporcional', etiqueta: '3 · Lista "A"', corto: 'Lista "A"' },
] as const

/**
 * Quién postula, en una insignia.
 *
 * Vive en el encabezado porque es el dato que gobierna todo lo demás y conviene
 * tenerlo a la vista sin gastar una columna. Desde la Fase 2 es además la puerta
 * para cambiarlo.
 */
function InsigniaPostulante({ postulante }: { postulante: Postulante }) {
  return (
    <Badge variant="outline" className="h-auto gap-1.5 py-1 pl-1.5">
      {postulante.modalidad}
      <span aria-hidden className="text-muted-foreground">
        ·
      </span>
      {postulante.integrantes.map((partido) => (
        <EtiquetaPartido key={partido} partido={partido} tamano="sm" />
      ))}
    </Badge>
  )
}

/**
 * Avanza al paso siguiente.
 *
 * Nombra el destino en vez de decir solo «Siguiente»: quien lo pulsa sabe a
 * dónde va sin volver a leer las pestañas. En el último paso no se dibuja,
 * porque no hay a dónde avanzar —el cierre lo dictamina el panel de la
 * izquierda— y un botón muerto es peor que ninguno.
 */
function Siguiente({ desde, onAvanzar }: { desde: string; onAvanzar: (valor: string) => void }) {
  const proxima = FASES[FASES.findIndex((f) => f.valor === desde) + 1]
  if (!proxima) return null
  return (
    <div className="flex justify-end">
      <Button onClick={() => onAvanzar(proxima.valor)}>
        Siguiente: {proxima.corto}
        <IconArrowRight data-icon="inline-end" />
      </Button>
    </div>
  )
}

function App() {
  const arrastre = useEsEscritorio()
  const [fase, setFase] = useState<string>('convenio')
  const [direccion, setDireccion] = useState(1)
  const [activo, setActivo] = useState<string | null>(null)
  const [aceptado, setAceptado] = useState(false)
  const [postulanteAbierto, setPostulanteAbierto] = useState(false)
  const llenadoRapido = useConfiguracion((c) => c.opciones.mostrarLlenadoRapido)

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
    const enDistritos = distritos.flatMap((d) => formulasEnDistrito(d.postulacion))
    return (
      bandeja.find((f) => f.id === id) ??
      enDistritos.find((f) => f.id === id) ??
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
      <FondoMica />

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
            <p className="text-muted-foreground text-[0.6875rem] font-medium tracking-wide uppercase">
              Proceso Electoral Local 2026-2027
            </p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            {/*
              La caja del postulante vive en un solo sitio a la vez. En la Fase 1
              está en la columna derecha, donde todavía se negocia con quién se
              compite; desde la Fase 2 esa columna la ocupa la bandeja y el
              postulante se consulta desde aquí. Dos instancias a la vez tendrían
              dos estados locales que acabarían discrepando.
            */}
            {postulante &&
              (fase === 'convenio' ? (
                <InsigniaPostulante postulante={postulante} />
              ) : (
                <Popover open={postulanteAbierto} onOpenChange={setPostulanteAbierto}>
                  <PopoverTrigger
                    aria-label="Cambiar el postulante"
                    className="focus-visible:ring-ring rounded-4xl transition-opacity outline-none hover:opacity-80 focus-visible:ring-[3px]"
                  >
                    <InsigniaPostulante postulante={postulante} />
                  </PopoverTrigger>
                  {/* Sin relleno propio: lo pone la `Card` de dentro. */}
                  <PopoverContent className="w-[22rem] p-0">
                    <ConfiguracionPostulante
                      enPopover
                      onAplicar={() => setPostulanteAbierto(false)}
                    />
                  </PopoverContent>
                </Popover>
              ))}
            <Tutorial />
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
                <m.div
                  custom={direccion}
                  variants={paso}
                  initial="entra"
                  animate="centro"
                  className="space-y-4"
                >
                  <FaseConvenio arrastre={arrastre} />
                  <Siguiente desde="convenio" onAvanzar={cambiarFase} />
                </m.div>
              </TabsContent>
              <TabsContent value="mayoria" className="pt-2">
                <m.div
                  custom={direccion}
                  variants={paso}
                  initial="entra"
                  animate="centro"
                  className="space-y-4"
                >
                  <FaseMayoria arrastre={arrastre} />
                  <Siguiente desde="mayoria" onAvanzar={cambiarFase} />
                </m.div>
              </TabsContent>
              <TabsContent value="proporcional" className="pt-2">
                <m.div
                  custom={direccion}
                  variants={paso}
                  initial="entra"
                  animate="centro"
                  className="space-y-4"
                >
                  <FaseProporcional arrastre={arrastre} />
                  <Siguiente desde="proporcional" onAvanzar={cambiarFase} />
                </m.div>
              </TabsContent>
            </Tabs>
            <PanelBalance />
          </m.div>

          <m.aside variants={aparicion} className="xl:col-start-3 xl:row-start-1">
            {/*
              Una caja releva a la otra en vez de apilarse. En la Fase 1 no hay
              fórmulas que repartir, así que la bandeja sobra; a partir de la
              Fase 2 el postulante ya está decidido y se consulta desde el
              encabezado. El relevo se cruza para que el cambio de paso no sea un
              parpadeo.
            */}
            <AnimatePresence mode="wait" initial={false}>
              {fase === 'convenio' ? (
                <m.div
                  key="postulante"
                  variants={aparicion}
                  initial="oculto"
                  animate="visible"
                  exit="saliente"
                >
                  <ConfiguracionPostulante />
                </m.div>
              ) : (
                <m.div
                  key="bandeja"
                  variants={aparicion}
                  initial="oculto"
                  animate="visible"
                  exit="saliente"
                >
                  <div className="space-y-4">
                    {llenadoRapido && <ControlesLlenado fase={fase} />}
                    <Bandeja arrastre={arrastre} />
                  </div>
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
      <AvisoCierre />
      <TramaProyecto />
    </DndContext>
  )
}

export default App
