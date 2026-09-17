import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

/**
 * Cliente Drizzle único (singleton) para uso em código de SERVIDOR apenas
 * (API routes, server actions, server components). Nunca importar este
 * módulo em código que roda no browser.
 *
 * Conecta como a role `app_runtime` (sem BYPASSRLS) via pooler Supavisor
 * (transaction mode, porta 6543) — ver .env.local para detalhes.
 */
declare global {
  // eslint-disable-next-line no-var
  var __dbClient: postgres.Sql | undefined;
}

const connectionString = process.env.RUNTIME_DATABASE_URL;

if (!connectionString) {
  throw new Error(
    'RUNTIME_DATABASE_URL não definida. Configure .env.local ou as env vars da Vercel.'
  );
}

// Em dev, reaproveita a conexão entre hot-reloads para não esgotar o pool.
const client =
  global.__dbClient ??
  postgres(connectionString, {
    ssl: 'require',
    max: 10,
    // Pooler em transaction mode não suporta prepared statements.
    prepare: false,
  });

if (process.env.NODE_ENV !== 'production') {
  global.__dbClient = client;
}

export const db = drizzle(client, { schema });
export { schema };
export { client as pgClient };
