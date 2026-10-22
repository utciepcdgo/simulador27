/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Modo proyecto: `'true'` superpone la trama de «PROYECTO» sobre el sitio.
   *
   * Llega como texto, no como booleano: `import.meta.env` son cadenas. Quien la
   * lea debe compararla, y para eso está `MODO_PROYECTO` en `lib/proyecto.ts`.
   */
  readonly PROJECT_MODE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
