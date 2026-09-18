import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-lg font-bold text-slate-900">
            <span className="text-indigo-600">Gamifica</span> E-commerce
          </span>
          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
            >
              Entrar
            </Link>
            <Link
              href="/cadastro"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              Criar conta gratuita
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center bg-gradient-to-b from-indigo-50 via-white to-white px-6">
        <div className="max-w-2xl text-center">
          <span className="inline-block rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
            Gamificação para lojas de e-commerce
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Capture mais leads com raspadinhas, roletas e pop-ups na sua loja
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Instale em minutos via Google Tag Manager — sem tocar no código da
            sua loja. Capture leads com consentimento LGPD, acompanhe tudo em
            um painel simples e exporte quando quiser.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/cadastro"
              className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              Comece agora, é gratuito
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Já tenho conta
            </Link>
          </div>

          <dl className="mt-16 grid grid-cols-1 gap-6 text-left sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <dt className="text-sm font-semibold text-slate-900">Instalação simples</dt>
              <dd className="mt-1 text-sm text-slate-500">
                Um único snippet no GTM, sem depender do time de tecnologia.
              </dd>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <dt className="text-sm font-semibold text-slate-900">LGPD por padrão</dt>
              <dd className="mt-1 text-sm text-slate-500">
                Consentimento granular (participação × marketing) em cada lead.
              </dd>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <dt className="text-sm font-semibold text-slate-900">Dados na sua mão</dt>
              <dd className="mt-1 text-sm text-slate-500">
                Painel com leads, exportação em CSV e trilha de auditoria completa.
              </dd>
            </div>
          </dl>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        Gamifica E-commerce — plataforma de gamificação para lojas online.
      </footer>
    </div>
  );
}
