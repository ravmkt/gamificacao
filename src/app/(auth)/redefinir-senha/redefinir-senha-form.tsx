'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { redefinirSenha } from '@/lib/actions/auth-actions';

export function RedefinirSenhaForm() {
  const router = useRouter();
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);

    const form = new FormData(e.currentTarget);
    const novaSenha = String(form.get('novaSenha') ?? '');
    const confirmarSenha = String(form.get('confirmarSenha') ?? '');

    if (novaSenha !== confirmarSenha) {
      setErro('As senhas não coincidem.');
      return;
    }

    setCarregando(true);
    const resultado = await redefinirSenha({ novaSenha });
    setCarregando(false);

    if (!resultado.sucesso) {
      setErro(resultado.erro);
      return;
    }

    setSucesso(true);
    setTimeout(() => {
      router.push('/painel');
      router.refresh();
    }, 1500);
  }

  if (sucesso) {
    return (
      <div className="mt-6 rounded-lg bg-emerald-50 px-4 py-4 text-sm text-emerald-700" role="status">
        Senha redefinida com sucesso! Redirecionando para o painel...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
      {erro && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {erro}
        </div>
      )}

      <div>
        <label htmlFor="novaSenha" className="block text-sm font-medium text-slate-700">
          Nova senha
        </label>
        <input
          id="novaSenha"
          name="novaSenha"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          placeholder="Mínimo 8 caracteres"
        />
      </div>

      <div>
        <label htmlFor="confirmarSenha" className="block text-sm font-medium text-slate-700">
          Confirmar nova senha
        </label>
        <input
          id="confirmarSenha"
          name="confirmarSenha"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          placeholder="Repita a senha"
        />
      </div>

      <button
        type="submit"
        disabled={carregando}
        className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {carregando ? 'Salvando...' : 'Redefinir senha'}
      </button>
    </form>
  );
}
