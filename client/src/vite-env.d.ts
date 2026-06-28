/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** OAuth 2.0 Web application Client ID from Google Cloud Console — used for "Sign in with Google". */
  readonly VITE_GOOGLE_CLIENT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
