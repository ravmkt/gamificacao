import { pgTable, uuid, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { lojas } from './lojas';
import { campanhas } from './campanhas';
import { statusLeadEnum, tipoConsentimentoEnum } from './enums';

export const leads = pgTable('leads', {
  id: uuid('id').primaryKey().defaultRandom(),
  lojaId: uuid('loja_id')
    .notNull()
    .references(() => lojas.id, { onDelete: 'cascade' }),
  campanhaId: uuid('campanha_id').references(() => campanhas.id, { onDelete: 'set null' }),
  nome: text('nome'),
  email: text('email'),
  telefone: text('telefone'),
  utmSource: text('utm_source'),
  utmMedium: text('utm_medium'),
  utmCampaign: text('utm_campaign'),
  utmTerm: text('utm_term'),
  utmContent: text('utm_content'),
  /** IP nunca é armazenado em texto puro — só hash (SHA-256), por privacidade/LGPD. */
  ipHash: text('ip_hash'),
  userAgent: text('user_agent'),
  status: statusLeadEnum('status').notNull().default('novo'),
  criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * LGPD: consentimento granular. Participar de uma campanha (ex.: raspadinha)
 * é distinto de aceitar marketing — cada tipo tem seu próprio registro,
 * versionado e datado, para auditoria.
 */
export const consentimentos = pgTable('consentimentos', {
  id: uuid('id').primaryKey().defaultRandom(),
  leadId: uuid('lead_id')
    .notNull()
    .references(() => leads.id, { onDelete: 'cascade' }),
  tipo: tipoConsentimentoEnum('tipo').notNull(),
  aceito: boolean('aceito').notNull(),
  versaoTermo: text('versao_termo').notNull(),
  ipHash: text('ip_hash'),
  userAgent: text('user_agent'),
  criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
});

/** Registro simples de rate limiting por loja+IP, sem depender de KV. */
export const limitesDeTaxa = pgTable('limites_de_taxa', {
  id: uuid('id').primaryKey().defaultRandom(),
  lojaId: uuid('loja_id')
    .notNull()
    .references(() => lojas.id, { onDelete: 'cascade' }),
  ipHash: text('ip_hash').notNull(),
  janelaInicio: timestamp('janela_inicio', { withTimezone: true }).notNull(),
  contagem: integer('contagem').notNull().default(0),
});

export const leadsRelations = relations(leads, ({ one, many }) => ({
  loja: one(lojas, { fields: [leads.lojaId], references: [lojas.id] }),
  campanha: one(campanhas, { fields: [leads.campanhaId], references: [campanhas.id] }),
  consentimentos: many(consentimentos),
}));

export const consentimentosRelations = relations(consentimentos, ({ one }) => ({
  lead: one(leads, { fields: [consentimentos.leadId], references: [leads.id] }),
}));

export type Lead = typeof leads.$inferSelect;
export type NovoLead = typeof leads.$inferInsert;
export type Consentimento = typeof consentimentos.$inferSelect;
export type NovoConsentimento = typeof consentimentos.$inferInsert;
export type LimiteDeTaxa = typeof limitesDeTaxa.$inferSelect;
