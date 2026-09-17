import { and, eq, gte } from 'drizzle-orm';
import { dbAdmin } from '@/db/admin';
import { schema } from '@/db';

const JANELA_MS = 10 * 60 * 1000; // 10 minutos
const LIMITE_PADRAO = 5; // máx. 5 leads por loja+IP dentro da janela

/**
 * Rate limiting simples baseado na tabela `limites_de_taxa` (sem depender
 * de KV/Redis). Usa `dbAdmin` porque esta tabela é escrita/lida no
 * contexto da API pública (sem sessão de usuário logado, portanto sem
 * app.current_loja_id definido via RLS) — o isolamento aqui é garantido
 * pelo filtro explícito por lojaId+ipHash na query.
 *
 * Estratégia: janela fixa (fixed window), não deslizante — simples e
 * suficiente para o volume esperado nesta etapa. Cada linha representa
 * uma janela de `JANELA_MS` para um par loja+IP; se a janela atual expirou,
 * reinicia a contagem.
 */
export async function verificarEIncrementarRateLimit(
  lojaId: string,
  ipHash: string | null,
  limite: number = LIMITE_PADRAO
): Promise<{ permitido: boolean; restantes: number }> {
  // Sem IP identificável (ex.: ambiente de teste sem header) — não bloqueia,
  // mas também não é possível rastrear abuso; loga e permite.
  if (!ipHash) {
    return { permitido: true, restantes: limite };
  }

  const agora = new Date();
  const inicioJanelaAtual = new Date(Math.floor(agora.getTime() / JANELA_MS) * JANELA_MS);

  return dbAdmin.transaction(async (tx) => {
    const [existente] = await tx
      .select()
      .from(schema.limitesDeTaxa)
      .where(
        and(
          eq(schema.limitesDeTaxa.lojaId, lojaId),
          eq(schema.limitesDeTaxa.ipHash, ipHash),
          gte(schema.limitesDeTaxa.janelaInicio, inicioJanelaAtual)
        )
      )
      .limit(1);

    if (!existente) {
      await tx.insert(schema.limitesDeTaxa).values({
        lojaId,
        ipHash,
        janelaInicio: inicioJanelaAtual,
        contagem: 1,
      });
      return { permitido: true, restantes: limite - 1 };
    }

    if (existente.contagem >= limite) {
      return { permitido: false, restantes: 0 };
    }

    await tx
      .update(schema.limitesDeTaxa)
      .set({ contagem: existente.contagem + 1 })
      .where(eq(schema.limitesDeTaxa.id, existente.id));

    return { permitido: true, restantes: limite - existente.contagem - 1 };
  });
}
