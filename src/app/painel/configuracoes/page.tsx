import { exigirSessaoComLoja } from '@/lib/auth';

export const metadata = { title: 'Configurações — Gamifica E-commerce' };

export default async function ConfiguracoesPage() {
  const sessao = await exigirSessaoComLoja();

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900">Configurações</h1>
      <p className="mt-1 text-sm text-slate-500">Dados da sua conta e da sua loja.</p>

      <div className="mt-6 space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700">Sua conta</h2>
          <dl className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">Nome</dt>
              <dd className="font-medium text-slate-800">{sessao.nome || '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">E-mail</dt>
              <dd className="font-medium text-slate-800">{sessao.email}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Papel na loja</dt>
              <dd className="font-medium text-slate-800">
                {sessao.papel === 'proprietario'
                  ? 'Proprietário'
                  : sessao.papel === 'administrador'
                    ? 'Administrador'
                    : 'Somente leitura'}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700">Sua loja</h2>
          <dl className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">Nome da loja</dt>
              <dd className="font-medium text-slate-800">{sessao.loja.nome}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Identificador (slug)</dt>
              <dd className="font-medium text-slate-800">{sessao.loja.slug}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700">Segurança</h2>
          <p className="mt-2 text-sm text-slate-500">
            Autenticação em duas etapas (2FA) estará disponível em breve.
          </p>
        </div>
      </div>
    </div>
  );
}
