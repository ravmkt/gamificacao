'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginLojista } from '@/lib/actions/auth-actions';

export function LoginForm() {
  const router = useRouter();
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    const form = new FormData(e.currentTarget);
    const resultado = await loginLojista({
      email: form.get('email'),
      senha: form.get('senha'),
    });

    setCarregando(false);

    if (!resultado.sucesso) {
      setErro(resultado.erro);
      return;
    }

    router.push('/painel');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
      {erro && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {erro}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          placeholder="voce@sualoja.com.br"
        />
      </div>

      <div>
        <label htmlFor="senha" className="block text-sm font-medium text-slate-700">
          Senha
        </label>
        <input
          id="senha"
          name="senha"
          type="password"
          required
          autoComplete="current-password"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          placeholder="Sua senha"
        />
      </div>

      <button
        type="submit"
        disabled={carregando}
        className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {carregando ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  );
}
