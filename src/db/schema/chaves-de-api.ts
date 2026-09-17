import { pgTable, uuid, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { lojas } from './lojas';

/**
 * Chave pública/secreta por loja. A chave pública identifica a loja no
 * widget (snippet JS) e na API pública /v1/leads. A chave secreta NUNCA
 * é usada no cliente — só armazenamos o hash (SHA-256) e os últimos 4
 * caracteres para exibição, igual ao padrão de chaves de API de mercado.
 */
export const chavesDeApi = pgTable('chaves_de_api', {
  id: uuid('id').primaryKey().defaultRandom(),
  lojaId: uuid('loja_id')
    .notNull()
    .references(() => lojas.id, { onDelete: 'cascade' }),
  chavePublica: text('chave_publica').notNull().unique(),
  chaveSecretaHash: text('chave_secreta_hash').notNull(),
  secretaUltimos4: text('secreta_ultimos4').notNull(),
  ativa: boolean('ativa').notNull().default(true),
  criadaEm: timestamp('criada_em', { withTimezone: true }).notNull().defaultNow(),
  revogadaEm: timestamp('revogada_em', { withTimezone: true }),
});

export const chavesDeApiRelations = relations(chavesDeApi, ({ one }) => ({
  loja: one(lojas, { fields: [chavesDeApi.lojaId], references: [lojas.id] }),
}));

export type ChaveDeApi = typeof chavesDeApi.$inferSelect;
export type NovaChaveDeApi = typeof chavesDeApi.$inferInsert;
