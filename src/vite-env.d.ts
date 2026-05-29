/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the chat backend in production (empty in dev → uses the Vite proxy). */
  readonly VITE_CHAT_API_BASE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
