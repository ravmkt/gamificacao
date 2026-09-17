'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cadastrarLojista } from '@/lib/actions/auth-actions';

export function CadastroForm() {
  const router = useRouter();
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aceitouTermos, setAceitouTermos] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);

    if (!aceitouTermos) {
      setErro('É necessário aceitar os termos de uso para continuar.');
      return;
    }

    const form = new FormData(e.currentTarget);
    setCarregando(true);

    const resultado = await cadastrarLojista({
      nome: form.get('nome'),
      nomeDaLoja: form.get('nomeDaLoja'),
      email: form.get('email'),
      senha: form.get('senha'),
      consentimentoMarketing: form.get('consentimentoMarketing') === 'on',
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
        <label htmlFor="nome" className="block text-sm font-medium text-slate-700">
          Seu nome
        </label>
        <input
          id="nome"
          name="nome"
          type="text"
          required
          autoComplete="name"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          placeholder="Ana Silva"
        />
      </div>

      <div>
        <label htmlFor="nomeDaLoja" className="block text-sm font-medium text-slate-700">
          Nome da sua loja
        </label>
        <input
          id="nomeDaLoja"
          name="nomeDaLoja"
          type="text"
          required
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          placeholder="Loja da Ana"
        />
      </div>

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
          minLength={8}
          autoComplete="new-password"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          placeholder="Mínimo 8 caracteres"
        />
      </div>

      <div className="space-y-2 border-t border-slate-100 pt-4">
        <label className="flex items-start gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            required
            checked={aceitouTermos}
            onChange={(e) => setAceitouTermos(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span>
            Li e aceito os{' '}
            <a href="#" className="font-medium text-indigo-600 hover:underline">
              Termos de Uso
            </a>{' '}
            e a{' '}
            <a href="#" className="font-medium text-indigo-600 hover:underline">
              Política de Privacidade
            </a>
            .
          </span>
        </label>

        <label className="flex items-start gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            name="consentimentoMarketing"
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span>Quero receber novidades e dicas por e-mail (opcional).</span>
        </label>
      </div>

      <button
        type="submit"
        disabled={carregando}
        className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {carregando ? 'Criando conta...' : 'Criar conta gratuita'}
      </button>
    </form>
  );
}
