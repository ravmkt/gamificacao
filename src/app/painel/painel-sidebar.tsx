'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITENS_MENU = [
  { href: '/painel', label: 'Início', icone: '🏠', exato: true },
  { href: '/painel/campanhas', label: 'Campanhas', icone: '🎯' },
  { href: '/painel/leads', label: 'Leads', icone: '👥' },
  { href: '/painel/instalacao', label: 'Instalação', icone: '🔌' },
  { href: '/painel/relatorios', label: 'Relatórios', icone: '📊' },
  { href: '/painel/configuracoes', label: 'Configurações', icone: '⚙️' },
];

const RotuloPapel: Record<string, string> = {
  proprietario: 'Proprietário',
  administrador: 'Administrador',
  somente_leitura: 'Somente leitura',
};

export function PainelSidebar({
  lojaNome,
  papel,
}: {
  lojaNome: string;
  papel: string | null;
}) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white px-4 py-6 sm:flex">
      <div className="mb-6 flex items-center gap-2 px-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
          G
        </span>
        <span className="text-lg font-semibold text-slate-800">Gamifica</span>
      </div>

      <div className="mb-4 rounded-lg bg-slate-50 px-3 py-2">
        <p className="truncate text-sm font-medium text-slate-800" title={lojaNome}>
          {lojaNome}
        </p>
        {papel && (
          <p className="text-xs text-slate-500">{RotuloPapel[papel] ?? papel}</p>
        )}
      </div>

      <nav aria-label="Menu do painel" className="flex-1 space-y-1">
        {ITENS_MENU.map((item) => {
          const ativo = item.exato
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={ativo ? 'page' : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                ativo
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span aria-hidden>{item.icone}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
