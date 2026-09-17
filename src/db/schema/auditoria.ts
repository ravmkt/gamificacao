import { pgTable, uuid, text, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { lojas } from './lojas';
import { usuarios } from './usuarios';

/** Log de auditoria de ações do lojista (criar/editar/excluir). */
export const logsDeAuditoria = pgTable('logs_de_auditoria', {
  id: uuid('id').primaryKey().defaultRandom(),
  lojaId: uuid('loja_id').references(() => lojas.id, { onDelete: 'set null' }),
  usuarioId: uuid('usuario_id').references(() => usuarios.id, { onDelete: 'set null' }),
  acao: text('acao').notNull(), // ex.: 'criar', 'editar', 'excluir'
  entidadeTipo: text('entidade_tipo').notNull(), // ex.: 'campanha', 'chave_de_api'
  entidadeId: text('entidade_id'),
  detalhes: jsonb('detalhes').notNull().default({}),
  ipHash: text('ip_hash'),
  criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
});

export const logsDeAuditoriaRelations = relations(logsDeAuditoria, ({ one }) => ({
  loja: one(lojas, { fields: [logsDeAuditoria.lojaId], references: [lojas.id] }),
  usuario: one(usuarios, { fields: [logsDeAuditoria.usuarioId], references: [usuarios.id] }),
}));

export type LogDeAuditoria = typeof logsDeAuditoria.$inferSelect;
export type NovoLogDeAuditoria = typeof logsDeAuditoria.$inferInsert;
