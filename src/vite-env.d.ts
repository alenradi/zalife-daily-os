/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_AI_ENDPOINT?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_ADMIN_CODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
