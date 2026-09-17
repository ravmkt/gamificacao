export const metadata = { title: 'Campanhas — Gamifica E-commerce' };

export default function CampanhasPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Campanhas</h1>
      <p className="mt-1 text-sm text-slate-500">
        Raspadinha, roleta, pop-up, barra de progresso e cupons chegam na próxima etapa do
        projeto.
      </p>

      <div className="mt-8 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <span aria-hidden className="text-4xl">🎯</span>
        <p className="mt-4 font-medium text-slate-700">Nenhuma campanha criada ainda</p>
        <p className="mt-1 max-w-sm text-sm text-slate-500">
          Esta funcionalidade será liberada em uma próxima etapa do projeto.
        </p>
      </div>
    </div>
  );
}
