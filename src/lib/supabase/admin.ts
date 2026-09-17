import { createClient } from '@supabase/supabase-js';

/**
 * Cliente Supabase ADMIN — usa a service_role key, que ignora RLS e tem
 * poderes administrativos (ex.: Admin API de usuários).
 *
 * ⚠️ NUNCA importar este módulo em código que roda no browser.
 * ⚠️ NUNCA expor SUPABASE_SERVICE_ROLE_KEY com prefixo NEXT_PUBLIC_.
 * Usar apenas em Route Handlers / Server Actions que precisem de operações
 * administrativas (ex.: deletar usuário, bypassar RLS por necessidade real).
 */
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurados.');
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
