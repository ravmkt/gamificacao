import { pgTable, uuid, text, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { lojas } from './lojas';
import { statusCampanhaEnum } from './enums';

/**
 * Estrutura genérica de campanha (jsonb de regras) — os tipos específicos
 * (raspadinha, roleta, pop-up, barra de progresso, UTM, indicação) serão
 * implementados na Etapa 2. Aqui só criamos a tabela-base para permitir
 * referências de leads/cupons/eventos a uma campanha futura.
 */
export const campanhas = pgTable('campanhas', {
  id: uuid('id').primaryKey().defaultRandom(),
  lojaId: uuid('loja_id')
    .notNull()
    .references(() => lojas.id, { onDelete: 'cascade' }),
  nome: text('nome').notNull(),
  /** Tipo textual livre por ora (enum fechado vem na Etapa 2: raspadinha, roleta, etc.) */
  tipo: text('tipo').notNull().default('generica'),
  status: statusCampanhaEnum('status').notNull().default('rascunho'),
  /** Regras específicas do tipo de campanha — schema livre até a Etapa 2 definir cada tipo. */
  regras: jsonb('regras').notNull().default({}),
  inicioEm: timestamp('inicio_em', { withTimezone: true }),
  fimEm: timestamp('fim_em', { withTimezone: true }),
  criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
  atualizadoEm: timestamp('atualizado_em', { withTimezone: true }).notNull().defaultNow(),
});

export const campanhasRelations = relations(campanhas, ({ one }) => ({
  loja: one(lojas, { fields: [campanhas.lojaId], references: [lojas.id] }),
}));

export type Campanha = typeof campanhas.$inferSelect;
export type NovaCampanha = typeof campanhas.$inferInsert;
