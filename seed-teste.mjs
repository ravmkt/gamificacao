import postgres from 'postgres';
import dotenv from 'dotenv';
import crypto from 'crypto';
dotenv.config({ path: '.env.local' });

const sql = postgres(process.env.DIRECT_URL, { ssl: 'require' });

// Cria uma loja de teste + chave de API ativa, sem depender do Supabase Auth
// (só para testar o endpoint /v1/leads isoladamente).
const [loja] = await sql`
  INSERT INTO lojas (nome, slug) VALUES ('Loja Teste E2E', 'loja-teste-e2e-' || substr(md5(random()::text), 1, 6))
  RETURNING id
`;

function sha256hex(s) { return crypto.createHash('sha256').update(s).digest('hex'); }
const chavePublica = 'pk_' + crypto.randomBytes(24).toString('base64url');
const chaveSecreta = 'sk_' + crypto.randomBytes(32).toString('base64url');
const chaveSecretaHash = sha256hex(chaveSecreta);
const secretaUltimos4 = chaveSecreta.slice(-4);

await sql`
  INSERT INTO chaves_de_api (loja_id, chave_publica, chave_secreta_hash, secreta_ultimos4, ativa)
  VALUES (${loja.id}, ${chavePublica}, ${chaveSecretaHash}, ${secretaUltimos4}, true)
`;

console.log(JSON.stringify({ lojaId: loja.id, chavePublica }));
await sql.end();
