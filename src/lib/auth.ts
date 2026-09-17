import { createSupabaseServerClient } from './supabase/server';
import { dbAdmin } from '@/db/admin';
import { schema } from '@/db';
import { eq } from 'drizzle-orm';

export type PapelMembro = 'proprietario' | 'administrador' | 'somente_leitura';

export type SessaoAtual = {
  usuarioId: string;
  email: string;
  nome: string;
  /** Loja ativa do usuário (primeira loja onde é membro — seletor multi-loja fica p/ etapa futura). */
  loja: { id: string; nome: string; slug: string } | null;
  papel: PapelMembro | null;
};

/**
 * Lê a sessão atual (Supabase Auth) e resolve o perfil da aplicação + loja/
 * papel do usuário. Retorna null se não autenticado.
 *
 * Usa `dbAdmin` (role postgres, BYPASSRLS) apenas para este lookup inicial
 * — que por definição precisa ocorrer ANTES de sabermos qual é a loja do
 * usuário (pré-requisito para setar app.current_loja_id e então usar RLS
 * normalmente no resto da aplicação). A query é sempre filtrada por
 * usuario_id vindo do token de sessão do Supabase Auth, nunca por input
 * externo não confiável — por isso é seguro apesar do bypass de RLS.
 */
export async function getSessaoAtual(): Promise<SessaoAtual | null> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const [perfil] = await dbAdmin
    .select()
    .from(schema.usuarios)
    .where(eq(schema.usuarios.id, user.id))
    .limit(1);

  const [membro] = await dbAdmin
    .select({
      lojaId: schema.membrosDaLoja.lojaId,
      papel: schema.membrosDaLoja.papel,
      lojaNome: schema.lojas.nome,
      lojaSlug: schema.lojas.slug,
    })
    .from(schema.membrosDaLoja)
    .innerJoin(schema.lojas, eq(schema.lojas.id, schema.membrosDaLoja.lojaId))
    .where(eq(schema.membrosDaLoja.usuarioId, user.id))
    .limit(1);

  return {
    usuarioId: user.id,
    email: user.email ?? '',
    nome: perfil?.nome ?? (user.user_metadata?.nome as string | undefined) ?? '',
    loja: membro ? { id: membro.lojaId, nome: membro.lojaNome, slug: membro.lojaSlug } : null,
    papel: membro?.papel ?? null,
  };
}

/**
 * Helper para uso em Route Handlers/Server Actions que exigem sessão válida
 * + loja associada. Lança erro 401/403 (via retorno estruturado) se faltar.
 */
export async function exigirSessaoComLoja(): Promise<
  SessaoAtual & { loja: NonNullable<SessaoAtual['loja']>; papel: PapelMembro }
> {
  const sessao = await getSessaoAtual();
  if (!sessao) {
    throw new AuthError('NAO_AUTENTICADO', 'Sessão inválida ou expirada.', 401);
  }
  if (!sessao.loja || !sessao.papel) {
    throw new AuthError('SEM_LOJA', 'Usuário não está vinculado a nenhuma loja.', 403);
  }
  return sessao as SessaoAtual & { loja: NonNullable<SessaoAtual['loja']>; papel: PapelMembro };
}

export class AuthError extends Error {
  constructor(
    public codigo: string,
    message: string,
    public status: number
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/** Verifica se o papel tem permissão de escrita (proprietario/administrador). */
export function papelPodeEscrever(papel: PapelMembro | null): boolean {
  return papel === 'proprietario' || papel === 'administrador';
}
