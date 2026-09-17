import { pgTable, uuid, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { lojas } from './lojas';
import { campanhas } from './campanhas';
import { statusCupomEnum } from './enums';

/**
 * Cupons — a geração do código/token assinado e a lógica de validação
 * (limite de uso, período de validade) serão implementadas na Etapa 2.
 * Aqui apenas a estrutura de dados-base.
 */
export const cupons = pgTable('cupons', {
  id: uuid('id').primaryKey().defaultRandom(),
  lojaId: uuid('loja_id')
    .notNull()
    .references(() => lojas.id, { onDelete: 'cascade' }),
  campanhaId: uuid('campanha_id').references(() => campanhas.id, { onDelete: 'set null' }),
  codigo: text('codigo').notNull(),
  tipoDesconto: text('tipo_desconto').notNull().default('percentual'), // 'percentual' | 'fixo'
  valor: integer('valor').notNull().default(0),
  limiteUso: integer('limite_uso'),
  usosAtuais: integer('usos_atuais').notNull().default(0),
  validoDe: timestamp('valido_de', { withTimezone: true }),
  validoAte: timestamp('valido_ate', { withTimezone: true }),
  status: statusCupomEnum('status').notNull().default('ativo'),
  /** Token assinado (JWT/HMAC) que prova a autenticidade do cupom — gerado na Etapa 2. */
  tokenAssinado: text('token_assinado'),
  criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
});

export const cuponsRelations = relations(cupons, ({ one }) => ({
  loja: one(lojas, { fields: [cupons.lojaId], references: [lojas.id] }),
  campanha: one(campanhas, { fields: [cupons.campanhaId], references: [campanhas.id] }),
}));

export type Cupom = typeof cupons.$inferSelect;
export type NovoCupom = typeof cupons.$inferInsert;
