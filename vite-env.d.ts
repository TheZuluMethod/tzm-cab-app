/// <reference types="vite/client" />

/**
 * Vite environment variable types
 * Extends ImportMeta to include env property
 */
interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
  readonly VITE_APP_TITLE?: string;
  // Add other VITE_ prefixed env vars as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
