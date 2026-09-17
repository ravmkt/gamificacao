/** Gera um slug simples a partir de um nome (lowercase, sem acentos, hífens). */
export function gerarSlug(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Adiciona um sufixo aleatório curto para reduzir colisão de slug. */
export function gerarSlugComSufixo(texto: string): string {
  const base = gerarSlug(texto) || 'loja';
  const sufixo = Math.random().toString(36).slice(2, 7);
  return `${base}-${sufixo}`;
}
