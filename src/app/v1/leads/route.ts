import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { dbAdmin } from '@/db/admin';
import { schema } from '@/db';
import { resolverLojaPorChavePublica } from '@/lib/api-publica';
import { verificarEIncrementarRateLimit } from '@/lib/rate-limit';
import { hashIpDeHeaders } from '@/lib/crypto';
import { dispararWebhooks } from '@/lib/webhooks';
import { registrarAuditoria } from '@/lib/auditoria';

/**
 * Endpoint PÚBLICO de captura de leads, consumido pelo widget instalado
 * na loja do lojista (domínio externo, por isso CORS liberado abaixo).
 * Autenticação: chave pública da loja no header `X-Gamifica-Public-Key`
 * (nunca a secreta — o widget roda no navegador do consumidor final).
 */

const VERSAO_TERMO_ATUAL = '2026-01-v1';

const payloadSchema = z.object({
  nome: z.string().trim().min(1).max(200).optional(),
  email: z.string().trim().email('E-mail inválido.').max(320),
  telefone: z.string().trim().max(40).optional(),
  campanhaId: z.string().uuid().optional().nullable(),
  utmSource: z.string().trim().max(200).optional(),
  utmMedium: z.string().trim().max(200).optional(),
  utmCampaign: z.string().trim().max(200).optional(),
  utmTerm: z.string().trim().max(200).optional(),
  utmContent: z.string().trim().max(200).optional(),
  consentimentoParticipacao: z.boolean(),
  consentimentoMarketing: z.boolean().optional().default(false),
  /** Honeypot: campo invisível no form real. Se vier preenchido, é bot. */
  empresa: z.string().optional().default(''),
});

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Gamifica-Public-Key',
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(request: NextRequest) {
  const headers = corsHeaders();

  const chavePublica = request.headers.get('X-Gamifica-Public-Key');
  if (!chavePublica) {
    return NextResponse.json(
      { erro: 'Chave pública ausente.' },
      { status: 401, headers }
    );
  }

  const lojaResolvida = await resolverLojaPorChavePublica(chavePublica);
  if (!lojaResolvida) {
    return NextResponse.json(
      { erro: 'Chave pública inválida.' },
      { status: 401, headers }
    );
  }

  let bodyJson: unknown;
  try {
    bodyJson = await request.json();
  } catch {
    return NextResponse.json({ erro: 'Corpo da requisição inválido.' }, { status: 400, headers });
  }

  const parsed = payloadSchema.safeParse(bodyJson);
  if (!parsed.success) {
    return NextResponse.json(
      { erro: 'Dados inválidos.', detalhes: parsed.error.issues.map((i) => i.message) },
      { status: 400, headers }
    );
  }
  const dados = parsed.data;

  // Honeypot: campo preenchido indica bot. Descarta SILENCIOSAMENTE (finge
  // sucesso) para não dar sinal ao bot de que foi detectado.
  if (dados.empresa && dados.empresa.trim().length > 0) {
    return NextResponse.json({ sucesso: true }, { status: 201, headers });
  }

  const ipHash = await hashIpDeHeaders(request.headers);

  const { permitido } = await verificarEIncrementarRateLimit(lojaResolvida.lojaId, ipHash);
  if (!permitido) {
    return NextResponse.json(
      { erro: 'Muitas tentativas. Tente novamente em alguns minutos.' },
      { status: 429, headers }
    );
  }

  const userAgent = request.headers.get('user-agent');

  let leadId: string;
  try {
    const [lead] = await dbAdmin
      .insert(schema.leads)
      .values({
        lojaId: lojaResolvida.lojaId,
        campanhaId: dados.campanhaId ?? null,
        nome: dados.nome ?? null,
        email: dados.email,
        telefone: dados.telefone ?? null,
        utmSource: dados.utmSource ?? null,
        utmMedium: dados.utmMedium ?? null,
        utmCampaign: dados.utmCampaign ?? null,
        utmTerm: dados.utmTerm ?? null,
        utmContent: dados.utmContent ?? null,
        ipHash,
        userAgent,
        status: 'novo',
      })
      .returning({ id: schema.leads.id });

    leadId = lead.id;

    await dbAdmin.insert(schema.consentimentos).values([
      {
        leadId,
        tipo: 'participacao_campanha',
        aceito: dados.consentimentoParticipacao,
        versaoTermo: VERSAO_TERMO_ATUAL,
        ipHash,
        userAgent,
      },
      {
        leadId,
        tipo: 'marketing',
        aceito: dados.consentimentoMarketing,
        versaoTermo: VERSAO_TERMO_ATUAL,
        ipHash,
        userAgent,
      },
    ]);

    await dbAdmin.insert(schema.eventos).values({
      lojaId: lojaResolvida.lojaId,
      tipo: 'lead_captured',
      payload: { leadId, campanhaId: dados.campanhaId ?? null },
      leadId,
    });
  } catch (e) {
    console.error('Erro ao gravar lead:', e);
    return NextResponse.json(
      { erro: 'Não foi possível registrar o lead. Tente novamente.' },
      { status: 500, headers }
    );
  }

  // Não bloqueia a resposta ao cliente por falha de webhook/auditoria.
  await Promise.allSettled([
    dispararWebhooks(lojaResolvida.lojaId, 'lead_captured', { leadId }),
    registrarAuditoria({
      acao: 'criar',
      entidadeTipo: 'lead',
      entidadeId: leadId,
      lojaId: lojaResolvida.lojaId,
      detalhes: { origem: 'widget', chaveId: lojaResolvida.chaveId },
    }),
  ]);

  return NextResponse.json({ sucesso: true }, { status: 201, headers });
}
