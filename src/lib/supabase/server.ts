import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Cliente Supabase para uso em Server Components, Route Handlers e Server
 * Actions. Lê/escreve a sessão do usuário via cookies do Next.js.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Chamado de um Server Component sem permissão de escrita de cookie
            // (ex.: durante renderização estática). O middleware garante o
            // refresh da sessão nesses casos — pode ignorar aqui.
          }
        },
      },
    }
  );
}
