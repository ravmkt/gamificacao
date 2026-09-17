import { exigirSessaoComLoja } from '@/lib/auth';
import { listarChavesDaLoja } from '@/lib/actions/chaves-actions';
import { InstalacaoClient } from './instalacao-client';

export const metadata = { title: 'Instalação e Integrações — Gamifica E-commerce' };

export default async function InstalacaoPage() {
  const sessao = await exigirSessaoComLoja();
  const chaves = await listarChavesDaLoja();
  const chaveAtiva = chaves.find((c) => c.ativa) ?? null;

  return (
    <InstalacaoClient
      chavePublica={chaveAtiva?.chavePublica ?? null}
      secretaUltimos4={chaveAtiva?.secretaUltimos4 ?? null}
      podeGerenciarChaves={sessao.papel === 'proprietario' || sessao.papel === 'administrador'}
    />
  );
}
