export const APP_VERSION = '0.9.0-playtest';
export const BUILD_DATE = '2026-05-22';
export const BUILD_CHANNEL = 'playtest';

export function getRuntimeEnvironment() {
  return import.meta.env.DEV ? 'dev' : 'production';
}

export function isPwaMode() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

export function isSupabaseFrontendConfigured() {
  return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
}

export function isFirebaseFrontendConfigured() {
  return Boolean(
    import.meta.env.VITE_FIREBASE_API_KEY
    && import.meta.env.VITE_FIREBASE_DATABASE_URL
    && import.meta.env.VITE_FIREBASE_PROJECT_ID
  );
}
