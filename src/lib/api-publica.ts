import { eq, and } from 'drizzle-orm';
import { dbAdmin } from '@/db/admin';
import { schema } from '@/db';

/**
 * Resolve a loja a partir de uma chave pública (usada pelo widget e pela
 * API pública /v1/*). Usa `dbAdmin` (bypass de RLS) porque este é
 * exatamente o lookup que DEFINE qual será o tenant/contexto RLS das
 * operações seguintes — é seguro pois filtramos por chave exata e ativa.
 */
export async function resolverLojaPorChavePublica(
  chavePublica: string
): Promise<{ lojaId: string; chaveId: string } | null> {
  if (!chavePublica || !chavePublica.startsWith('pk_')) return null;

  const [linha] = await dbAdmin
    .select({ lojaId: schema.chavesDeApi.lojaId, chaveId: schema.chavesDeApi.id })
    .from(schema.chavesDeApi)
    .where(
      and(eq(schema.chavesDeApi.chavePublica, chavePublica), eq(schema.chavesDeApi.ativa, true))
    )
    .limit(1);

  return linha ?? null;
}
