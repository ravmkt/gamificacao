import { sql } from 'drizzle-orm';
import { db, schema } from './index';

/**
 * Executa `callback` dentro de uma transação com o contexto de tenant/usuário
 * definido via `set_config`, exigido pelas políticas RLS (ver
 * drizzle/migrations/0001_rls_policies.sql).
 *
 * IMPORTANTE: `set_config(..., true)` com `true` = local à transação —
 * o valor não "escapa" para outras requisições que reaproveitem a mesma
 * conexão do pool, prevenindo vazamento de contexto entre tenants.
 *
 * Uso típico numa API route:
 *   const membro = await getMembroDaLojaAutenticado(request);
 *   const dados = await withTenantContext(membro.lojaId, membro.usuarioId, async (tx) => {
 *     return tx.select().from(schema.leads);
 *   });
 */
export async function withTenantContext<T>(
  lojaId: string | null,
  usuarioId: string | null,
  callback: (tx: Parameters<Parameters<typeof db.transaction>[0]>[0]) => Promise<T>
): Promise<T> {
  return db.transaction(async (tx) => {
    if (lojaId) {
      await tx.execute(sql`SELECT set_config('app.current_loja_id', ${lojaId}, true)`);
    }
    if (usuarioId) {
      await tx.execute(sql`SELECT set_config('app.current_usuario_id', ${usuarioId}, true)`);
    }
    return callback(tx);
  });
}

/**
 * Variante para contextos SEM tenant (ex.: cadastro de usuário, antes de
 * ter loja). Apenas define o usuário, se houver.
 */
export async function withUserContext<T>(
  usuarioId: string | null,
  callback: (tx: Parameters<Parameters<typeof db.transaction>[0]>[0]) => Promise<T>
): Promise<T> {
  return withTenantContext(null, usuarioId, callback);
}

export { schema };
