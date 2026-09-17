import { redirect } from 'next/navigation';
import { exigirSessaoComLoja, AuthError } from '@/lib/auth';
import { PainelSidebar } from './painel-sidebar';
import { PainelTopbar } from './painel-topbar';

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  let sessao;
  try {
    sessao = await exigirSessaoComLoja();
  } catch (e) {
    if (e instanceof AuthError && e.codigo === 'NAO_AUTENTICADO') {
      redirect('/login?redirect=/painel');
    }
    // SEM_LOJA ou outro erro inesperado: não deveria ocorrer no fluxo normal
    // (todo cadastro cria loja+proprietário), mas tratamos defensivamente.
    redirect('/login?erro=sem_loja');
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <PainelSidebar lojaNome={sessao.loja.nome} papel={sessao.papel} />
      <div className="flex flex-1 flex-col">
        <PainelTopbar nome={sessao.nome} email={sessao.email} lojaNome={sessao.loja.nome} />
        <main className="flex-1 px-4 py-6 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
