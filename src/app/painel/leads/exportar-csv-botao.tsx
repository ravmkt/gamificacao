'use client';

export function ExportarCsvBotao() {
  return (
    <a
      href="/painel/leads/exportar"
      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
      download
    >
      ⬇️ Exportar CSV
    </a>
  );
}
