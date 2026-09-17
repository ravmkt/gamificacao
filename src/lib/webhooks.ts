import { eq, and } from 'drizzle-orm';
import { dbAdmin } from '@/db/admin';
import { schema } from '@/db';
import { hmacSha256Hex } from '@/lib/crypto';

const TIMEOUT_MS = 5000;

/**
 * Dispara o evento `tipoEvento` para todos os webhooks ativos da loja que
 * estejam assinando esse tipo. Modo atual: entrega DIRETA e síncrona (com
 * timeout), registrando o resultado em `webhook_entregas` — não há fila
 * assíncrona real nesta etapa (isso é aceitável no MVP; requer um worker
 * dedicado — ex. Vercel Cron/QStash — para retry automático em etapa
 * futura, ver TODO abaixo).
 *
 * TODO(Etapa futura): mover para fila assíncrona com retry exponencial via
 * cron job (Vercel Cron), reprocessando linhas com status='falhou' e
 * proxima_tentativa_em <= now().
 *
 * Nunca lança exceção — falha de webhook não deve quebrar a captura do lead.
 */
export async function dispararWebhooks(
  lojaId: string,
  tipoEvento: string,
  payload: Record<string, unknown>
): Promise<void> {
  try {
    const webhooksAtivos = await dbAdmin
      .select()
      .from(schema.webhooks)
      .where(and(eq(schema.webhooks.lojaId, lojaId), eq(schema.webhooks.ativo, true)));

    const relevantes = webhooksAtivos.filter((w) => {
      const eventos = Array.isArray(w.eventosAssinados) ? (w.eventosAssinados as string[]) : [];
      return eventos.includes(tipoEvento);
    });

    for (const webhook of relevantes) {
      await entregarWebhookUnico(webhook, tipoEvento, payload);
    }
  } catch (e) {
    console.error('Falha ao processar disparo de webhooks (não bloqueante):', e);
  }
}

async function entregarWebhookUnico(
  webhook: typeof schema.webhooks.$inferSelect,
  tipoEvento: string,
  payload: Record<string, unknown>
): Promise<void> {
  const corpo = JSON.stringify({ tipo: tipoEvento, dados: payload, enviadoEm: new Date().toISOString() });
  const assinatura = await hmacSha256Hex(webhook.segredoAssinatura, corpo);

  const [entrega] = await dbAdmin
    .insert(schema.webhookEntregas)
    .values({
      webhookId: webhook.id,
      eventoTipo: tipoEvento,
      payload,
      status: 'pendente',
      tentativas: 1,
    })
    .returning();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const resposta = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Gamifica-Signature': assinatura,
      },
      body: corpo,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    await dbAdmin
      .update(schema.webhookEntregas)
      .set({
        status: resposta.ok ? 'enviado' : 'falhou',
        respostaHttpStatus: resposta.status,
      })
      .where(eq(schema.webhookEntregas.id, entrega.id));
  } catch (e) {
    console.error(`Falha ao entregar webhook ${webhook.id}:`, e);
    await dbAdmin
      .update(schema.webhookEntregas)
      .set({ status: 'falhou' })
      .where(eq(schema.webhookEntregas.id, entrega.id));
  }
}
