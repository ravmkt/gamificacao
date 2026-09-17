'use server';

import { eq, and } from 'drizzle-orm';
import { exigirSessaoComLoja, papelPodeEscrever } from '@/lib/auth';
import { withTenantContext } from '@/db/tenant-context';
import { schema } from '@/db';
import { gerarParDeChaves } from '@/lib/crypto';
import { registrarAuditoria } from '@/lib/auditoria';

export type ChaveResumo = {
  id: string;
  chavePublica: string;
  secretaUltimos4: string;
  ativa: boolean;
  criadaEm: string;
};

/** Lista as chaves de API da loja atual (dentro do contexto RLS). */
export async function listarChavesDaLoja(): Promise<ChaveResumo[]> {
  const sessao = await exigirSessaoComLoja();

  return withTenantContext(sessao.loja.id, sessao.usuarioId, async (tx) => {
    const linhas = await tx
      .select({
        id: schema.chavesDeApi.id,
        chavePublica: schema.chavesDeApi.chavePublica,
        secretaUltimos4: schema.chavesDeApi.secretaUltimos4,
        ativa: schema.chavesDeApi.ativa,
        criadaEm: schema.chavesDeApi.criadaEm,
      })
      .from(schema.chavesDeApi)
      .where(eq(schema.chavesDeApi.lojaId, sessao.loja.id))
      .orderBy(schema.chavesDeApi.criadaEm);

    return linhas.map((l) => ({ ...l, criadaEm: l.criadaEm.toISOString() }));
  });
}

export type RegenerarChaveResultado =
  | { sucesso: true; chavePublica: string; chaveSecreta: string }
  | { sucesso: false; erro: string };

/**
 * Revoga a chave ativa atual e gera um novo par público/secreto.
 * A chave secreta em texto claro só existe neste retorno — nunca é
 * persistida (só o hash) nem pode ser recuperada depois.
 * Requer papel proprietário/administrador (somente_leitura não pode).
 */
export async function regenerarChaveDaLoja(): Promise<RegenerarChaveResultado> {
  const sessao = await exigirSessaoComLoja();

  if (!papelPodeEscrever(sessao.papel)) {
    return { sucesso: false, erro: 'Você não tem permissão para regenerar a chave de API.' };
  }

  const { chavePublica, chaveSecreta, chaveSecretaHash, secretaUltimos4 } =
    await gerarParDeChaves();

  await withTenantContext(sessao.loja.id, sessao.usuarioId, async (tx) => {
    await tx
      .update(schema.chavesDeApi)
      .set({ ativa: false, revogadaEm: new Date() })
      .where(
        and(eq(schema.chavesDeApi.lojaId, sessao.loja.id), eq(schema.chavesDeApi.ativa, true))
      );

    await tx.insert(schema.chavesDeApi).values({
      lojaId: sessao.loja.id,
      chavePublica,
      chaveSecretaHash,
      secretaUltimos4,
    });
  });

  await registrarAuditoria({
    acao: 'regenerar',
    entidadeTipo: 'chave_de_api',
    lojaId: sessao.loja.id,
    usuarioId: sessao.usuarioId,
    detalhes: { chavePublica },
  });

  return { sucesso: true, chavePublica, chaveSecreta };
}
