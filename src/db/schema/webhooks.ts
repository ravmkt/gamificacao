import { pgTable, uuid, text, boolean, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { lojas } from './lojas';
import { statusEntregaWebhookEnum } from './enums';

/** Configuração de um webhook de saída cadastrado pelo lojista. */
export const webhooks = pgTable('webhooks', {
  id: uuid('id').primaryKey().defaultRandom(),
  lojaId: uuid('loja_id')
    .notNull()
    .references(() => lojas.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  /** Lista de tipos de evento assinados, ex.: ["lead_captured", "campaign_viewed"] */
  eventosAssinados: jsonb('eventos_assinados').notNull().default([]),
  segredoAssinatura: text('segredo_assinatura').notNull(),
  ativo: boolean('ativo').notNull().default(true),
  criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Fila de entregas de webhook. Sem cron/triggers (não suportado em deploy
 * hosted Cloudflare, e evitado aqui por simplicidade) — disparo é feito de
 * forma assíncrona best-effort na própria requisição que gera o evento,
 * com fallback de "catch-up" (reprocessa pendentes) implementado depois.
 * TODO: worker de entrega real (ex.: QStash, Vercel Cron) — mock por ora.
 */
export const webhookEntregas = pgTable('webhook_entregas', {
  id: uuid('id').primaryKey().defaultRandom(),
  webhookId: uuid('webhook_id')
    .notNull()
    .references(() => webhooks.id, { onDelete: 'cascade' }),
  eventoTipo: text('evento_tipo').notNull(),
  payload: jsonb('payload').notNull().default({}),
  status: statusEntregaWebhookEnum('status').notNull().default('pendente'),
  tentativas: integer('tentativas').notNull().default(0),
  proximaTentativaEm: timestamp('proxima_tentativa_em', { withTimezone: true }),
  respostaHttpStatus: integer('resposta_http_status'),
  criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
});

export const webhooksRelations = relations(webhooks, ({ one, many }) => ({
  loja: one(lojas, { fields: [webhooks.lojaId], references: [lojas.id] }),
  entregas: many(webhookEntregas),
}));

export const webhookEntregasRelations = relations(webhookEntregas, ({ one }) => ({
  webhook: one(webhooks, { fields: [webhookEntregas.webhookId], references: [webhooks.id] }),
}));

export type Webhook = typeof webhooks.$inferSelect;
export type NovoWebhook = typeof webhooks.$inferInsert;
export type WebhookEntrega = typeof webhookEntregas.$inferSelect;
