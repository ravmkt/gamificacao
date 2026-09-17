'use client';

import { useState } from 'react';
import { solicitarRecuperacaoSenha } from '@/lib/actions/auth-actions';

export function RecuperarSenhaForm() {
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    const form = new FormData(e.currentTarget);
    const resultado = await solicitarRecuperacaoSenha({ email: form.get('email') });

    setCarregando(false);

    if (!resultado.sucesso) {
      setErro(resultado.erro);
      return;
    }

    setEnviado(true);
  }

  if (enviado) {
    return (
      <div className="mt-6 rounded-lg bg-emerald-50 px-4 py-4 text-sm text-emerald-700" role="status">
        Se este e-mail estiver cadastrado, você receberá um link para redefinir sua senha em
        poucos minutos. Verifique também a caixa de spam.
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

      <button
        type="submit"
        disabled={carregando}
        className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {carregando ? 'Enviando...' : 'Enviar link de recuperação'}
      </button>
    </form>
  );
}
