/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL base del backend. Vacío en desarrollo (se usa el proxy de Vite). */
  readonly VITE_API_URL?: string;
  /** "true" activa los datos de ejemplo locales (solo desarrollo). */
  readonly VITE_USE_MOCKS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
