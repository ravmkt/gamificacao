'use server';

import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { dbAdmin } from '@/db/admin';
import { schema } from '@/db';
import { gerarSlugComSufixo } from '@/lib/slug';
import { gerarParDeChaves } from '@/lib/crypto';
import { registrarAuditoria } from '@/lib/auditoria';

const cadastroSchema = z.object({
  nome: z.string().min(2, 'Informe seu nome completo.'),
  nomeDaLoja: z.string().min(2, 'Informe o nome da sua loja.'),
  email: z.string().email('E-mail inválido.'),
  senha: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres.'),
  consentimentoMarketing: z.boolean().optional().default(false),
});

export type CadastroResultado =
  | { sucesso: true }
  | { sucesso: false; erro: string; campo?: string };

/**
 * Cadastro completo do lojista: cria usuário no Supabase Auth, e em
 * seguida — atomicamente no Postgres — o perfil (`usuarios`), a loja
 * (`lojas`), o vínculo (`membros_da_loja` como proprietário), a assinatura
 * inicial (plano gratuito/trial) e o par de chaves de API da loja.
 *
 * Se qualquer etapa após a criação no Auth falhar, o usuário do Auth é
 * removido (rollback manual, já que Auth e Postgres são sistemas distintos).
 */
export async function cadastrarLojista(input: unknown): Promise<CadastroResultado> {
  const parsed = cadastroSchema.safeParse(input);
  if (!parsed.success) {
    const primeiro = parsed.error.issues[0];
    return { sucesso: false, erro: primeiro.message, campo: String(primeiro.path[0]) };
  }
  const { nome, nomeDaLoja, email, senha } = parsed.data;

  const supabase = await createSupabaseServerClient();

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password: senha,
    options: { data: { nome } },
  });

  if (signUpError) {
    return { sucesso: false, erro: traduzErroSupabase(signUpError.message), campo: 'email' };
  }

  const usuarioId = signUpData.user?.id;
  if (!usuarioId) {
    return { sucesso: false, erro: 'Não foi possível criar o usuário. Tente novamente.' };
  }

  try {
    await dbAdmin.transaction(async (tx) => {
      await tx.insert(schema.usuarios).values({ id: usuarioId, nome, email });

      const [loja] = await tx
        .insert(schema.lojas)
        .values({ nome: nomeDaLoja, slug: gerarSlugComSufixo(nomeDaLoja) })
        .returning();

      await tx.insert(schema.membrosDaLoja).values({
        lojaId: loja.id,
        usuarioId,
        papel: 'proprietario',
        conviteStatus: 'aceito',
      });

      // Plano inicial padrão: garante existência do plano "inicial" (idempotente).
      let [planoInicial] = await tx
        .select()
        .from(schema.planos)
        .where(eq(schema.planos.slug, 'inicial'));

      if (!planoInicial) {
        [planoInicial] = await tx
          .insert(schema.planos)
          .values({
            nome: 'Inicial',
            slug: 'inicial',
            limites: { maxCampanhas: 3, maxLeadsMes: 1000 },
            precoCentavos: 0,
          })
          .returning();
      }

      await tx.insert(schema.assinaturas).values({
        lojaId: loja.id,
        planoId: planoInicial.id,
        status: 'trial',
      });

      const { chavePublica, chaveSecretaHash, secretaUltimos4 } = await gerarParDeChaves();
      await tx.insert(schema.chavesDeApi).values({
        lojaId: loja.id,
        chavePublica,
        chaveSecretaHash,
        secretaUltimos4,
      });

      return loja;
    }).then(async (loja) => {
      // Fora da transação principal (mas ainda antes do retorno de sucesso):
      // registrarAuditoria usa dbAdmin com sua própria conexão, então não
      // precisa (nem deve) participar da mesma transação atômica acima.
      await registrarAuditoria({
        acao: 'criar',
        entidadeTipo: 'loja',
        entidadeId: loja.id,
        lojaId: loja.id,
        usuarioId,
        detalhes: { origem: 'cadastro' },
      });
    });
  } catch (e) {
    // Rollback manual do usuário no Auth, já que a transação Postgres falhou.
    const admin = createSupabaseAdminClient();
    await admin.auth.admin.deleteUser(usuarioId).catch(() => {});
    console.error('Erro ao provisionar loja no cadastro:', e);
    return { sucesso: false, erro: 'Erro ao criar sua conta. Tente novamente em instantes.' };
  }

  return { sucesso: true };
}

const loginSchema = z.object({
  email: z.string().email('E-mail inválido.'),
  senha: z.string().min(1, 'Informe sua senha.'),
});

export type LoginResultado = { sucesso: true } | { sucesso: false; erro: string };

export async function loginLojista(input: unknown): Promise<LoginResultado> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { sucesso: false, erro: parsed.error.issues[0].message };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.senha,
  });

  if (error) {
    return { sucesso: false, erro: 'E-mail ou senha incorretos.' };
  }

  if (data.user) {
    const [membro] = await dbAdmin
      .select({ lojaId: schema.membrosDaLoja.lojaId })
      .from(schema.membrosDaLoja)
      .where(eq(schema.membrosDaLoja.usuarioId, data.user.id))
      .limit(1);

    await registrarAuditoria({
      acao: 'login',
      entidadeTipo: 'sessao',
      lojaId: membro?.lojaId ?? null,
      usuarioId: data.user.id,
    });
  }

  return { sucesso: true };
}

export async function logoutLojista(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    const [membro] = await dbAdmin
      .select({ lojaId: schema.membrosDaLoja.lojaId })
      .from(schema.membrosDaLoja)
      .where(eq(schema.membrosDaLoja.usuarioId, data.user.id))
      .limit(1);

    await registrarAuditoria({
      acao: 'logout',
      entidadeTipo: 'sessao',
      lojaId: membro?.lojaId ?? null,
      usuarioId: data.user.id,
    });
  }

  await supabase.auth.signOut();
}

const recuperarSenhaSchema = z.object({
  email: z.string().email('E-mail inválido.'),
});

export async function solicitarRecuperacaoSenha(
  input: unknown
): Promise<{ sucesso: true } | { sucesso: false; erro: string }> {
  const parsed = recuperarSenhaSchema.safeParse(input);
  if (!parsed.success) {
    return { sucesso: false, erro: parsed.error.issues[0].message };
  }

  const supabase = await createSupabaseServerClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  // Não revelamos se o e-mail existe ou não (evita enumeração de contas).
  // redirectTo aponta para o callback PKCE, que troca o code por sessão e
  // só então encaminha para /redefinir-senha (onde o usuário já está
  // autenticado e pode chamar redefinirSenha()).
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${appUrl}/auth/callback?next=/redefinir-senha`,
  });

  // Auditoria da SOLICITAÇÃO (evento de segurança), independente do e-mail
  // existir ou não — a resposta ao chamador continua genérica (sem
  // enumeração de contas); o lookup abaixo é só para anexar usuarioId
  // quando existir, e nunca altera o comportamento observável da resposta.
  const [usuarioExistente] = await dbAdmin
    .select({ id: schema.usuarios.id })
    .from(schema.usuarios)
    .where(eq(schema.usuarios.email, parsed.data.email))
    .limit(1);

  await registrarAuditoria({
    acao: 'criar',
    entidadeTipo: 'solicitacao_recuperacao_senha',
    usuarioId: usuarioExistente?.id ?? null,
    detalhes: { email: parsed.data.email },
  });

  return { sucesso: true };
}

const redefinirSenhaSchema = z.object({
  novaSenha: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres.'),
});

export async function redefinirSenha(
  input: unknown
): Promise<{ sucesso: true } | { sucesso: false; erro: string }> {
  const parsed = redefinirSenhaSchema.safeParse(input);
  if (!parsed.success) {
    return { sucesso: false, erro: parsed.error.issues[0].message };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.updateUser({ password: parsed.data.novaSenha });

  if (error) {
    return { sucesso: false, erro: 'Não foi possível redefinir a senha. O link pode ter expirado.' };
  }

  if (data.user) {
    await registrarAuditoria({
      acao: 'editar',
      entidadeTipo: 'senha_usuario',
      usuarioId: data.user.id,
    });
  }

  return { sucesso: true };
}

function traduzErroSupabase(msg: string): string {
  if (msg.includes('already registered') || msg.includes('already exists')) {
    return 'Este e-mail já está cadastrado.';
  }
  if (msg.includes('Password should be')) {
    return 'A senha não atende aos requisitos mínimos de segurança.';
  }
  return 'Não foi possível concluir o cadastro. Verifique os dados e tente novamente.';
}
