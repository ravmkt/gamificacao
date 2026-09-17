import { pgTable, uuid, text, integer, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { lojas } from './lojas';
import { statusAssinaturaEnum } from './enums';

/**
 * Planos do SaaS (Inicial, Profissional, Enterprise). Nesta etapa apenas
 * modelamos a estrutura — sem cobrança/checkout implementado.
 */
export const planos = pgTable('planos', {
  id: uuid('id').primaryKey().defaultRandom(),
  nome: text('nome').notNull(),
  slug: text('slug').notNull().unique(),
  /** Limites do plano (ex.: { maxCampanhas: 3, maxLeadsMes: 1000 }) — flexível para evoluir. */
  limites: jsonb('limites').notNull().default({}),
  precoCentavos: integer('preco_centavos').notNull().default(0),
  ativo: boolean('ativo').notNull().default(true),
  criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
});

export const assinaturas = pgTable('assinaturas', {
  id: uuid('id').primaryKey().defaultRandom(),
  lojaId: uuid('loja_id')
    .notNull()
    .references(() => lojas.id, { onDelete: 'cascade' }),
  planoId: uuid('plano_id')
    .notNull()
    .references(() => planos.id, { onDelete: 'restrict' }),
  status: statusAssinaturaEnum('status').notNull().default('trial'),
  iniciadaEm: timestamp('iniciada_em', { withTimezone: true }).notNull().defaultNow(),
  expiraEm: timestamp('expira_em', { withTimezone: true }),
  criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
});

export const planosRelations = relations(planos, ({ many }) => ({
  assinaturas: many(assinaturas),
}));

export const assinaturasRelations = relations(assinaturas, ({ one }) => ({
  loja: one(lojas, { fields: [assinaturas.lojaId], references: [lojas.id] }),
  plano: one(planos, { fields: [assinaturas.planoId], references: [planos.id] }),
}));

export type Plano = typeof planos.$inferSelect;
export type Assinatura = typeof assinaturas.$inferSelect;
export type NovaAssinatura = typeof assinaturas.$inferInsert;
