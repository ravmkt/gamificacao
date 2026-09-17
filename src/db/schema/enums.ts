import { pgEnum } from 'drizzle-orm/pg-core';

/** Papel do usuário dentro de uma loja (tenant). Mais papéis virão em etapas futuras. */
export const papelMembroEnum = pgEnum('papel_membro', [
  'proprietario',
  'administrador',
  'somente_leitura',
]);

/** Status de convite de um membro à loja. */
export const statusConviteEnum = pgEnum('status_convite', [
  'pendente',
  'aceito',
  'revogado',
]);

/** Status geral da loja (tenant). */
export const statusLojaEnum = pgEnum('status_loja', [
  'ativa',
  'suspensa',
  'cancelada',
]);

/** Status da assinatura do plano. */
export const statusAssinaturaEnum = pgEnum('status_assinatura', [
  'trial',
  'ativa',
  'inadimplente',
  'cancelada',
]);

/** Status de uma campanha (estrutura genérica — tipos específicos vêm na Etapa 2). */
export const statusCampanhaEnum = pgEnum('status_campanha', [
  'rascunho',
  'ativa',
  'pausada',
  'encerrada',
]);

/** Status de processamento de um lead. */
export const statusLeadEnum = pgEnum('status_lead', [
  'novo',
  'processado',
  'invalido',
  'spam',
]);

/** Status de um cupom. */
export const statusCupomEnum = pgEnum('status_cupom', [
  'ativo',
  'esgotado',
  'expirado',
  'cancelado',
]);

/** Tipo de consentimento LGPD — participação em campanha é distinto de marketing. */
export const tipoConsentimentoEnum = pgEnum('tipo_consentimento', [
  'participacao_campanha',
  'marketing',
]);

/** Status de entrega de um webhook. */
export const statusEntregaWebhookEnum = pgEnum('status_entrega_webhook', [
  'pendente',
  'enviado',
  'falhou',
]);
