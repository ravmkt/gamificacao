import { createBrowserClient } from '@supabase/ssr';

/**
 * Cliente Supabase para uso em Client Components (browser). Usa apenas a
 * chave pública (anon/publishable) — nunca a service_role aqui.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
