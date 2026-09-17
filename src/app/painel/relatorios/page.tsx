export const metadata = { title: 'Relatórios — Gamifica E-commerce' };

export default function RelatoriosPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Relatórios</h1>
      <p className="mt-1 text-sm text-slate-500">
        Dashboards de receita e conversão por campanha chegam em uma etapa futura.
      </p>

      <div className="mt-8 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <span aria-hidden className="text-4xl">📊</span>
        <p className="mt-4 font-medium text-slate-700">Ainda não há dados suficientes</p>
        <p className="mt-1 max-w-sm text-sm text-slate-500">
          Capture leads e crie campanhas para começar a ver relatórios aqui.
        </p>
      </div>
    </div>
  );
}
