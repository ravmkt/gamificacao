/**
 * Referência mínima ao schema `auth` gerenciado pelo Supabase Auth.
 * NÃO criamos/alteramos esta tabela via migration — ela já existe e é
 * gerenciada internamente pelo Supabase (auth.users). Declaramos aqui
 * apenas o suficiente para permitir Foreign Keys type-safe do Drizzle
 * a partir das nossas tabelas em `public`.
 *
 * Autenticação (cadastro, login, recuperação de senha, sessões, e a
 * infraestrutura de MFA/2FA) é 100% delegada ao Supabase Auth — não
 * reimplementamos hashing de senha, tabela de sessões nem tokens de
 * recuperação manualmente.
 */
import { pgSchema, uuid } from 'drizzle-orm/pg-core';

export const authSchema = pgSchema('auth');

export const authUsers = authSchema.table('users', {
  id: uuid('id').primaryKey(),
});
