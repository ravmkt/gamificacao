import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    // Session mode (porta 5432 do pooler) para rodar migrations com segurança.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
  },
  // auth.users é gerenciada pelo Supabase — nunca incluir no diff de migrations.
  schemaFilter: ['public'],
  verbose: true,
  strict: true,
});
