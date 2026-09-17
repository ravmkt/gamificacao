import { webcrypto as crypto } from 'crypto';

/**
 * Utilitários de criptografia usando Web Crypto API (disponível tanto em
 * Node.js quanto em Edge Runtime — mantém compatibilidade caso alguma rota
 * futura precise rodar em Edge).
 */

/** Hash SHA-256 de uma string, retornado em hex. Usado para IP (LGPD) e segredos. */
export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Gera uma string aleatória segura em base64url, do tamanho de bytes informado. */
export function randomToken(bytes = 32): string {
  const buf = crypto.getRandomValues(new Uint8Array(bytes));
  return Buffer.from(buf).toString('base64url');
}

/** Gera um par de chaves pública/secreta para uma loja. */
export async function gerarParDeChaves() {
  const chavePublica = `pk_${randomToken(24)}`;
  const chaveSecreta = `sk_${randomToken(32)}`;
  const chaveSecretaHash = await sha256Hex(chaveSecreta);
  const secretaUltimos4 = chaveSecreta.slice(-4);
  return { chavePublica, chaveSecreta, chaveSecretaHash, secretaUltimos4 };
}

/** Extrai o IP a partir do header x-forwarded-for (padrão Vercel) e retorna seu hash. */
export async function hashIpDeHeaders(
  headers: Headers | ReadonlyHeaders
): Promise<string | null> {
  const forwarded = headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : null;
  if (!ip) return null;
  return sha256Hex(ip);
}

/** Extrai o IP do request (considerando proxies da Vercel) e retorna seu hash. */
export async function hashIpDoRequest(request: Request): Promise<string | null> {
  return hashIpDeHeaders(request.headers);
}

type ReadonlyHeaders = { get(name: string): string | null };

/** Gera uma assinatura HMAC-SHA256 (hex) de `payload` usando `segredo` — usado para assinar webhooks. */
export async function hmacSha256Hex(segredo: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(segredo),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const assinatura = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(assinatura))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
