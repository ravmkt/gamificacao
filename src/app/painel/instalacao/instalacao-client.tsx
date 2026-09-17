'use client';

import { useState } from 'react';
import { regenerarChaveDaLoja } from '@/lib/actions/chaves-actions';

function CopiarBotao({ texto, label = 'Copiar' }: { texto: string; label?: string }) {
  const [copiado, setCopiado] = useState(false);

  async function handleCopiar() {
    await navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleCopiar}
      className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
    >
      {copiado ? '✓ Copiado!' : label}
    </button>
  );
}

export function InstalacaoClient({
  chavePublica,
  secretaUltimos4,
  podeGerenciarChaves,
}: {
  chavePublica: string | null;
  secretaUltimos4: string | null;
  podeGerenciarChaves: boolean;
}) {
  const [chaveSecretaNova, setChaveSecretaNova] = useState<string | null>(null);
  const [chavePublicaAtual, setChavePublicaAtual] = useState(chavePublica);
  const [regenerando, setRegenerando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  const snippetGtm = chavePublicaAtual
    ? `<script>
  (function(w,d,s,k){
    w.dataLayer = w.dataLayer || [];
    var f = d.createElement(s);
    f.async = true;
    f.src = '${appUrl}/widget.js';
    f.setAttribute('data-gamifica-key', k);
    d.head.appendChild(f);
  })(window, document, 'script', '${chavePublicaAtual}');
</script>`
    : '';

  async function handleRegenerar() {
    setErro(null);
    setRegenerando(true);
    const resultado = await regenerarChaveDaLoja();
    setRegenerando(false);
    setConfirmando(false);

    if (!resultado.sucesso) {
      setErro(resultado.erro);
      return;
    }

    setChavePublicaAtual(resultado.chavePublica);
    setChaveSecretaNova(resultado.chaveSecreta);
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Instalação e Integrações</h1>
        <p className="mt-1 text-sm text-slate-500">
          Instale o widget na sua loja via Google Tag Manager (GTM) para começar a exibir
          campanhas e capturar leads.
        </p>
      </div>

      {erro && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {erro}
        </div>
      )}

      {/* Passo a passo */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700">Como instalar</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-600">
          <li>Copie o snippet abaixo.</li>
          <li>
            No <span className="font-medium">Google Tag Manager</span> da sua loja, crie uma
            nova tag do tipo &quot;HTML personalizado&quot; e cole o snippet.
          </li>
          <li>Defina o acionador para disparar em &quot;Todas as páginas&quot;.</li>
          <li>Publique o contêiner do GTM.</li>
          <li>Volte aqui — o status abaixo mudará quando recebermos o primeiro evento.</li>
        </ol>
      </section>

      {/* Snippet */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Snippet de instalação (GTM)</h2>
          {snippetGtm && <CopiarBotao texto={snippetGtm} label="Copiar snippet" />}
        </div>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-900 px-4 py-3 text-xs text-slate-100">
          <code>{snippetGtm || 'Nenhuma chave de API ativa encontrada.'}</code>
        </pre>
      </section>

      {/* Status */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700">Status da instalação</h2>
        <div className="mt-3 flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" aria-hidden />
          <p className="text-sm text-slate-600">
            Aguardando primeiro evento —{' '}
            <span className="text-slate-400">
              este status é atualizado automaticamente quando o widget enviar dados.
            </span>
          </p>
        </div>
      </section>

      {/* Chaves de API */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700">Chaves de API</h2>
        <p className="mt-1 text-sm text-slate-500">
          A chave pública identifica sua loja no widget e na API. A chave secreta é usada apenas
          para integrações de backend (webhooks, automações) e é exibida apenas uma vez, no
          momento em que é gerada.
        </p>

        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
            <span className="text-xs font-medium text-slate-500">Chave pública</span>
            <code className="flex-1 truncate text-sm text-slate-800">
              {chavePublicaAtual ?? '—'}
            </code>
            {chavePublicaAtual && <CopiarBotao texto={chavePublicaAtual} />}
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
            <span className="text-xs font-medium text-slate-500">Chave secreta</span>
            <code className="flex-1 truncate text-sm text-slate-800">
              {secretaUltimos4 ? `sk_••••••••${secretaUltimos4}` : '—'}
            </code>
          </div>

          {chaveSecretaNova && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3">
              <p className="text-xs font-semibold text-amber-800">
                ⚠️ Guarde esta chave secreta agora — ela não será exibida novamente:
              </p>
              <div className="mt-2 flex items-center gap-2">
                <code className="flex-1 truncate text-sm text-amber-900">{chaveSecretaNova}</code>
                <CopiarBotao texto={chaveSecretaNova} />
              </div>
            </div>
          )}
        </div>

        {podeGerenciarChaves && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            {!confirmando ? (
              <button
                type="button"
                onClick={() => setConfirmando(true)}
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-100"
              >
                Regenerar chave secreta
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <p className="text-sm text-slate-600">
                  Isso invalida a chave secreta atual. Continuar?
                </p>
                <button
                  type="button"
                  onClick={handleRegenerar}
                  disabled={regenerando}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
                >
                  {regenerando ? 'Gerando...' : 'Sim, regenerar'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmando(false)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Webhooks (reservado) */}
      <section className="rounded-xl border border-dashed border-slate-300 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-700">Webhooks</h2>
        <p className="mt-1 text-sm text-slate-500">
          Configuração de webhooks de saída (Make, Zapier, n8n) chega em uma etapa futura. A
          infraestrutura de entrega já está pronta no backend.
        </p>
      </section>
    </div>
  );
}
