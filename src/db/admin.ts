import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

/**
 * Cliente Drizzle ADMIN — conecta como a role `postgres` (superuser,
 * BYPASSRLS). Usar SOMENTE para:
 *   1) Operações de sistema que por definição precisam ocorrer antes de
 *      sabermos o tenant (ex.: descobrir a que loja um usuário pertence
 *      no login) — sempre filtradas explicitamente por usuario_id/id.
 *   2) Rotinas administrativas internas (seed, scripts).
 *
 * ⚠️ NUNCA usar este cliente para servir dados de listagem/CRUD do painel
 * sem um filtro de tenant explícito na query — ele ignora RLS.
 * Para tudo relacionado a dados JÁ dentro do contexto de uma loja, use
 * `withTenantContext` (src/db/tenant-context.ts) com o cliente `db` normal.
 */
declare global {
  var __dbAdminClient: postgres.Sql | undefined;
}

const connectionString = process.env.DIRECT_URL;

if (!connectionString) {
  throw new Error('DIRECT_URL não definida. Configure .env.local ou as env vars da Vercel.');
}

const client =
  global.__dbAdminClient ??
  postgres(connectionString, {
    ssl: 'require',
    max: 5,
    prepare: false,
  });

if (process.env.NODE_ENV !== 'production') {
  global.__dbAdminClient = client;
}

export const dbAdmin = drizzle(client, { schema });
