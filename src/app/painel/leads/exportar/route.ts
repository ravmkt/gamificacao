import { NextResponse } from 'next/server';
import { exigirSessaoComLoja, AuthError } from '@/lib/auth';
import { buscarLeadsDaLoja } from '@/lib/leads-query';
import { registrarAuditoria } from '@/lib/auditoria';

/**
 * Exportação de leads em CSV, autenticada no escopo da loja do usuário
 * logado (RLS aplicado via buscarLeadsDaLoja/withTenantContext).
 *
 * BOM UTF-8 no início do arquivo garante que o Excel (Windows) reconheça
 * corretamente a codificação e não corrompa acentos/caracteres especiais.
 *
 * "Streaming" aqui é implementado via ReadableStream nativo do Web Streams
 * API — cada linha do CSV é enviada como um chunk separado, sem acumular
 * o arquivo inteiro em memória antes de responder (importante para lojas
 * com muitos leads no futuro).
 */

function escaparCampoCsv(valor: string | null | undefined): string {
  const texto = valor ?? '';
  if (texto.includes(',') || texto.includes('"') || texto.includes('\n')) {
    return `"${texto.replace(/"/g, '""')}"`;
  }
  return texto;
}

function formatarDataIso(data: Date): string {
  return data.toISOString();
}

export async function GET() {
  let sessao;
  try {
    sessao = await exigirSessaoComLoja();
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ erro: e.message }, { status: e.status });
    }
    return NextResponse.json({ erro: 'Erro inesperado.' }, { status: 500 });
  }

  const leads = await buscarLeadsDaLoja(sessao.loja.id, sessao.usuarioId);

  const CABECALHO = [
    'Nome',
    'E-mail',
    'Telefone',
    'UTM Source',
    'UTM Medium',
    'UTM Campaign',
    'Consentimento Participação',
    'Consentimento Marketing',
    'Status',
    'Capturado em (UTC)',
  ];

  const encoder = new TextEncoder();
  const BOM_UTF8 = '\uFEFF';

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(BOM_UTF8));
      controller.enqueue(encoder.encode(CABECALHO.join(',') + '\r\n'));

      for (const lead of leads) {
        const linha = [
          escaparCampoCsv(lead.nome),
          escaparCampoCsv(lead.email),
          escaparCampoCsv(lead.telefone),
          escaparCampoCsv(lead.utmSource),
          escaparCampoCsv(lead.utmMedium),
          escaparCampoCsv(lead.utmCampaign),
          lead.consentimentoParticipacao === null
            ? ''
            : lead.consentimentoParticipacao
              ? 'Sim'
              : 'Não',
          lead.consentimentoMarketing === null ? '' : lead.consentimentoMarketing ? 'Sim' : 'Não',
          escaparCampoCsv(lead.status),
          formatarDataIso(lead.criadoEm),
        ].join(',');

        controller.enqueue(encoder.encode(linha + '\r\n'));
      }

      controller.close();
    },
  });

  const nomeArquivo = `leads-${sessao.loja.slug}-${new Date().toISOString().slice(0, 10)}.csv`;

  // Auditoria da exportação — não bloqueia a resposta (fire-and-forget seguro,
  // já que registrarAuditoria nunca lança exceção).
  registrarAuditoria({
    acao: 'exportar',
    entidadeTipo: 'leads_csv',
    lojaId: sessao.loja.id,
    usuarioId: sessao.usuarioId,
    detalhes: { totalLeads: leads.length },
  });

  return new NextResponse(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${nomeArquivo}"`,
      'Cache-Control': 'no-store',
    },
  });
}
