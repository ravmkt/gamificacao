import Link from 'next/link';
import { exigirSessaoComLoja } from '@/lib/auth';

export const metadata = { title: 'Painel — Gamifica E-commerce' };

const CARDS_RESUMO = [
  { label: 'Leads capturados', valor: 0, icone: '👥' },
  { label: 'Campanhas ativas', valor: 0, icone: '🎯' },
  { label: 'Conversões', valor: 0, icone: '✅' },
];

const PASSOS_ONBOARDING = [
  {
    numero: 1,
    titulo: 'Instale o snippet do GTM na sua loja',
    descricao:
      'Copie o script na tela de Instalação e cole no Google Tag Manager da sua loja para ativar os widgets.',
    href: '/painel/instalacao',
    acao: 'Ir para Instalação',
  },
  {
    numero: 2,
    titulo: 'Crie sua primeira campanha',
    descricao:
      'Raspadinha, roleta, pop-up e outras campanhas chegam na próxima etapa. Por enquanto, prepare a instalação.',
    href: '/painel/campanhas',
    acao: 'Ver Campanhas',
  },
  {
    numero: 3,
    titulo: 'Acompanhe os resultados',
    descricao: 'Veja leads capturados e exporte em CSV a qualquer momento.',
    href: '/painel/leads',
    acao: 'Ver Leads',
  },
];

export default async function PainelPage() {
  const sessao = await exigirSessaoComLoja();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Olá, {sessao.nome || 'lojista'} 👋</h1>
        <p className="mt-1 text-sm text-slate-500">
          Este é o painel da loja <span className="font-medium">{sessao.loja.nome}</span>.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {CARDS_RESUMO.map((card) => (
          <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">{card.label}</p>
              <span aria-hidden className="text-xl">
                {card.icone}
              </span>
            </div>
            <p className="mt-2 text-3xl font-bold text-slate-900">{card.valor}</p>
          </div>
        ))}
      </div>

      <section id="onboarding-section" aria-labelledby="onboarding-titulo">
        <h2 id="onboarding-titulo" className="text-lg font-semibold text-slate-900">
          Primeiros passos
        </h2>
        <ol className="mt-4 space-y-3">
          {PASSOS_ONBOARDING.map((passo) => (
            <li
              key={passo.numero}
              className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:items-center"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                {passo.numero}
              </span>
              <div className="flex-1">
                <p className="font-medium text-slate-800">{passo.titulo}</p>
                <p className="text-sm text-slate-500">{passo.descricao}</p>
              </div>
              <Link
                href={passo.href}
                className="shrink-0 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100"
              >
                {passo.acao}
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
