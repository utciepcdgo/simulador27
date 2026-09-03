import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { domMax, LazyMotion, MotionConfig } from 'motion/react'
import './index.css'
import { SUAVE } from './lib/animacion.ts'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/*
      `reducedMotion="user"` respeta la preferencia del sistema en toda la
      aplicación: quien la tenga activada conserva los fundidos y pierde los
      desplazamientos y las escalas. Va aquí y no en cada componente para que no
      pueda olvidarse en el siguiente que se anime.
    */}
    <MotionConfig reducedMotion="user" transition={SUAVE}>
      {/*
        `LazyMotion` con `strict` carga solo el paquete de funciones que la
        aplicación usa y prohíbe el componente `motion` completo: con `strict`,
        cualquier `motion.div` que se cuele lanza en desarrollo en vez de volver
        a arrastrar el paquete entero al bundle. `domMax` es el mínimo que
        incluye animaciones de disposición, que la bandeja y el dictamen sí usan.
      */}
      <LazyMotion features={domMax} strict>
        <App />
      </LazyMotion>
    </MotionConfig>
  </StrictMode>,
)
