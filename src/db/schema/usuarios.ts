import { pgTable, uuid, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { authUsers } from './auth-ref';

/**
 * Perfil da aplicação para cada usuário autenticado via Supabase Auth.
 * 1:1 com auth.users (id compartilhado). Supabase Auth já cuida de:
 * senha_hash, cadastro, login, recuperação de senha, verificação de e-mail
 * e infraestrutura de MFA — por isso não duplicamos esses campos aqui.
 */
export const usuarios = pgTable('usuarios', {
  id: uuid('id')
    .primaryKey()
    .references(() => authUsers.id, { onDelete: 'cascade' }),
  nome: text('nome').notNull(),
  email: text('email').notNull(),
  // Estrutura pronta para 2FA (não implementado nesta etapa — TODO Etapa futura):
  doisFatoresHabilitado: boolean('dois_fatores_habilitado').notNull().default(false),
  criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
  atualizadoEm: timestamp('atualizado_em', { withTimezone: true }).notNull().defaultNow(),
});

export type Usuario = typeof usuarios.$inferSelect;
export type NovoUsuario = typeof usuarios.$inferInsert;
