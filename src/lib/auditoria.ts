import { dbAdmin } from '@/db/admin';
import { schema } from '@/db';
import { hashIpDeHeaders } from '@/lib/crypto';
import { headers } from 'next/headers';

type AcaoAuditoria = 'criar' | 'editar' | 'excluir' | 'login' | 'logout' | 'exportar' | 'regenerar';

/**
 * Registra uma linha em logs_de_auditoria. Usa `dbAdmin` (bypass de RLS)
 * porque auditoria é uma escrita de sistema que pode ocorrer em contextos
 * sem loja ainda resolvida (ex.: login antes de sabermos a loja) — sempre
 * recebe lojaId/usuarioId explícitos do chamador, nunca infere de fontes
 * não confiáveis.
 *
 * Falhas de auditoria NUNCA devem quebrar o fluxo principal — por isso
 * captura e loga localmente em caso de erro, sem propagar exceção.
 */
export async function registrarAuditoria(params: {
  acao: AcaoAuditoria;
  entidadeTipo: string;
  entidadeId?: string | null;
  lojaId?: string | null;
  usuarioId?: string | null;
  detalhes?: Record<string, unknown>;
}): Promise<void> {
  try {
    const h = await headers().catch(() => null);
    const ipHash = h ? await hashIpDeHeaders(h) : null;

    await dbAdmin.insert(schema.logsDeAuditoria).values({
      lojaId: params.lojaId ?? null,
      usuarioId: params.usuarioId ?? null,
      acao: params.acao,
      entidadeTipo: params.entidadeTipo,
      entidadeId: params.entidadeId ?? null,
      detalhes: params.detalhes ?? {},
      ipHash,
    });
  } catch (e) {
    console.error('Falha ao registrar auditoria (não bloqueante):', e);
  }
}
