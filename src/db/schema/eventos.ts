import { pgTable, uuid, text, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { lojas } from './lojas';
import { leads } from './leads';

/**
 * Eventos genéricos disparados pelo widget/backend (ex.: lead_captured,
 * campaign_viewed). Usado para métricas futuras e para alimentar webhooks.
 */
export const eventos = pgTable('eventos', {
  id: uuid('id').primaryKey().defaultRandom(),
  lojaId: uuid('loja_id')
    .notNull()
    .references(() => lojas.id, { onDelete: 'cascade' }),
  tipo: text('tipo').notNull(),
  payload: jsonb('payload').notNull().default({}),
  leadId: uuid('lead_id').references(() => leads.id, { onDelete: 'set null' }),
  criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
});

export const eventosRelations = relations(eventos, ({ one }) => ({
  loja: one(lojas, { fields: [eventos.lojaId], references: [lojas.id] }),
  lead: one(leads, { fields: [eventos.leadId], references: [leads.id] }),
}));

export type Evento = typeof eventos.$inferSelect;
export type NovoEvento = typeof eventos.$inferInsert;
