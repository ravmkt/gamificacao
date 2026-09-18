import { exigirSessaoComLoja } from '@/lib/auth';
import { buscarLeadsDaLoja } from '@/lib/leads-query';
import { ExportarCsvBotao } from './exportar-csv-botao';

export const metadata = { title: 'Leads — Gamifica E-commerce' };

const RotuloStatus: Record<string, string> = {
  novo: 'Novo',
  processado: 'Processado',
  invalido: 'Inválido',
  spam: 'Spam',
};

function formatarData(data: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(data);
}

export default async function LeadsPage() {
  const sessao = await exigirSessaoComLoja();
  const leads = await buscarLeadsDaLoja(sessao.loja.id, sessao.usuarioId, 200);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Leads</h1>
          <p className="mt-1 text-sm text-slate-500">
            Contatos capturados pelos widgets instalados na sua loja.
          </p>
        </div>
        <ExportarCsvBotao />
      </div>

      {leads.length === 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <span aria-hidden className="text-4xl">
            👥
          </span>
          <p className="mt-4 font-medium text-slate-700">Nenhum lead capturado ainda</p>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            Instale o widget na sua loja para começar a capturar leads.
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">E-mail</th>
                <th className="px-4 py-3 font-medium">Telefone</th>
                <th className="px-4 py-3 font-medium">Origem (UTM)</th>
                <th className="px-4 py-3 font-medium">Marketing</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Capturado em</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-800">{lead.nome || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{lead.email || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{lead.telefone || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {lead.utmSource ? `${lead.utmSource} / ${lead.utmMedium || '—'}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        lead.consentimentoMarketing
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {lead.consentimentoMarketing ? 'Aceito' : 'Não aceito'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                      {RotuloStatus[lead.status] ?? lead.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatarData(lead.criadoEm)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
