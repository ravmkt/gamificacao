import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { statusLojaEnum, papelMembroEnum, statusConviteEnum } from './enums';
import { usuarios } from './usuarios';

/** Loja = tenant. Isolamento multi-tenant é feito por loja_id em todas as tabelas filhas. */
export const lojas = pgTable('lojas', {
  id: uuid('id').primaryKey().defaultRandom(),
  nome: text('nome').notNull(),
  slug: text('slug').notNull().unique(),
  dominio: text('dominio'),
  status: statusLojaEnum('status').notNull().default('ativa'),
  criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
  atualizadoEm: timestamp('atualizado_em', { withTimezone: true }).notNull().defaultNow(),
});

/** Vínculo usuário+loja+papel. Um usuário pode pertencer a múltiplas lojas. */
export const membrosDaLoja = pgTable('membros_da_loja', {
  id: uuid('id').primaryKey().defaultRandom(),
  lojaId: uuid('loja_id')
    .notNull()
    .references(() => lojas.id, { onDelete: 'cascade' }),
  usuarioId: uuid('usuario_id')
    .notNull()
    .references(() => usuarios.id, { onDelete: 'cascade' }),
  papel: papelMembroEnum('papel').notNull().default('administrador'),
  conviteStatus: statusConviteEnum('convite_status').notNull().default('aceito'),
  criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
});

export const lojasRelations = relations(lojas, ({ many }) => ({
  membros: many(membrosDaLoja),
}));

export const membrosDaLojaRelations = relations(membrosDaLoja, ({ one }) => ({
  loja: one(lojas, { fields: [membrosDaLoja.lojaId], references: [lojas.id] }),
  usuario: one(usuarios, { fields: [membrosDaLoja.usuarioId], references: [usuarios.id] }),
}));

export type Loja = typeof lojas.$inferSelect;
export type NovaLoja = typeof lojas.$inferInsert;
export type MembroDaLoja = typeof membrosDaLoja.$inferSelect;
export type NovoMembroDaLoja = typeof membrosDaLoja.$inferInsert;
