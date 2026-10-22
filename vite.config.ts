import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  // Vite solo expone al cliente las variables con prefijo `VITE_`. `PROJECT_`
  // se añade para que el modo proyecto conserve el nombre con el que se pidió,
  // en vez de obligar a leer `VITE_PROJECT_MODE` en el `.env`.
  envPrefix: ['VITE_', 'PROJECT_'],
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})