'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { logoutLojista } from '@/lib/actions/auth-actions';

export function PainelTopbar({
  nome,
  email,
  lojaNome,
}: {
  nome: string;
  email: string;
  lojaNome: string;
}) {
  const router = useRouter();
  const [saindo, setSaindo] = useState(false);

  async function handleSair() {
    setSaindo(true);
    await logoutLojista();
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:px-8">
      {/* Seletor de loja: hoje cada lojista tem 1 loja só. Multi-loja (convites
          entre lojas) fica para uma etapa futura — mantemos o rótulo fixo. */}
      <div className="text-sm text-slate-500">
        Loja atual: <span className="font-medium text-slate-800">{lojaNome}</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-slate-800">{nome}</p>
          <p className="text-xs text-slate-500">{email}</p>
        </div>
        <button
          type="button"
          onClick={handleSair}
          disabled={saindo}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
        >
          {saindo ? 'Saindo...' : 'Sair'}
        </button>
      </div>
    </header>
  );
}
