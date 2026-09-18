# Gamifica E-commerce

Plataforma **multi-tenant SaaS** para lojistas de e-commerce criarem campanhas de
gamificação (raspadinha, roleta, pop-ups, barras de progresso, cupons, campanhas
de UTM/indicação) e capturarem leads, via um **widget embarcável** instalado
através do **Google Tag Manager (GTM)**.

Este repositório contém a **Etapa 1 (Fundação)**: arquitetura full-stack,
autenticação completa do lojista, multi-tenancy, banco de dados (15 tabelas +
RLS), tela de Instalação/Integrações, widget de captura de leads (<15KB),
endpoint público de captura, exportação de leads em CSV e trilha de auditoria.

> ⚠️ **Fora do escopo desta etapa** (chegam em etapas futuras): mecânicas de
> raspadinha/roleta/quiz reais, pontos/fidelidade, sorteios, testes A/B,
> automações de carrinho e a área do consumidor final. A infraestrutura de
> `campanhas` já existe no banco (campo `regras` em JSONB), mas sem lógica de
> jogo implementada — apenas o pop-up de demonstração do widget.

## Visão do produto

- **Quem usa**: lojistas de e-commerce (não o consumidor final).
- **Como se instala**: o lojista cola um snippet `<script>` no Google Tag
  Manager da própria loja — sem alterar o código-fonte do e-commerce.
- **O que o widget faz hoje**: captura UTMs de origem, grava cookies
  first-party, dispara eventos no `dataLayer` e exibe um pop-up de
  demonstração que grava leads (com consentimento LGPD granular) via a API
  pública da plataforma.
- **O que o lojista vê no painel**: métricas zeradas (ainda sem campanhas
  reais), lista de leads capturados com exportação CSV, e a tela de
  Instalação com a chave pública/secreta de API.

## Stack técnica

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router), TypeScript |
| Estilo | Tailwind CSS v4 |
| ORM | Drizzle ORM (`postgres-js`) |
| Banco de dados | Supabase Postgres (via pooler Supavisor, região `sa-east-1`) |
| Autenticação | Supabase Auth (`@supabase/ssr`, cookies) |
| Segurança de dados | Row Level Security (RLS) nativa do Postgres, como defesa em profundidade |
| Widget | JavaScript puro (IIFE), sem dependências, minificado via Terser |
| Hospedagem recomendada | Vercel |

### Por que Supabase + Vercel (em vez de Cloudflare Pages)

Este projeto foi deliberadamente construído fora do template padrão de
Cloudflare Workers/Pages, a pedido do cliente, usando **Next.js + Vercel +
Supabase** — porque o produto precisa de Postgres relacional com RLS
avançado, autenticação completa com recuperação de senha, e Server Actions
do Next.js, que se encaixam melhor nesta stack do que no runtime de edge do
Cloudflare Workers.

## Arquitetura de dados: 15 tabelas + RLS

Todas as tabelas ficam no schema `public` do Postgres do Supabase (o schema
`auth.users`, gerenciado pelo próprio Supabase Auth, não é migrado por nós —
apenas referenciado para chaves estrangeiras).

| Tabela | Papel |
|---|---|
| `usuarios` | Perfil de aplicação 1:1 com `auth.users` |
| `lojas` | Tenant (loja do lojista) |
| `membros_da_loja` | Vínculo usuário↔loja com papel (`proprietario`, `administrador`, `somente_leitura`) |
| `planos` | Planos de assinatura disponíveis (limites de uso) |
| `assinaturas` | Assinatura ativa de cada loja a um plano |
| `chaves_de_api` | Par de chaves pública/secreta por loja (secreta só existe em texto claro no momento da geração) |
| `leads` | Leads capturados pelo widget |
| `consentimentos` | Consentimento LGPD granular por lead (participação × marketing) |
| `eventos` | Eventos de telemetria (ex.: `lead_captured`) |
| `cupons` | Cupons de desconto (estrutura pronta; geração automática é de etapa futura) |
| `campanhas` | Campanhas de gamificação (estrutura genérica em JSONB; mecânicas de jogo são de etapa futura) |
| `webhooks` | Webhooks de saída configurados pelo lojista |
| `webhook_entregas` | Log de tentativas de entrega de webhook (payload, status, timeout) |
| `limites_de_taxa` | Contador de rate limiting (janela fixa de 10 min) por loja+IP |
| `logs_de_auditoria` | Trilha de auditoria de todas as ações mutantes do lojista |

### Duas roles de banco, dois clientes Drizzle

- **`postgres`** (superuser, `BYPASSRLS`) — usado apenas em `src/db/admin.ts`
  (`dbAdmin`), para migrações e lookups de sistema que precisam ocorrer
  *antes* de sabermos a loja do usuário (ex.: descobrir a loja no login).
  Essas queries são sempre filtradas explicitamente por `usuario_id`/`id`.
- **`app_runtime`** (sem `BYPASSRLS`) — usado em `src/db/index.ts` (`db`) para
  **todo** o resto da aplicação. Toda query tenant-scoped passa por
  `withTenantContext()` (`src/db/tenant-context.ts`), que executa
  `set_config('app.current_loja_id', ..., true)` dentro de uma transação —
  as políticas RLS (`drizzle/migrations/0001_rls_policies.sql`) leem esse
  valor via `current_setting()` para isolar os dados de cada loja.

**Nunca** desabilite RLS nem use a role `postgres` para servir dados de
listagem/CRUD do painel sem um filtro de tenant explícito — é exatamente o
que a arquitetura foi desenhada para evitar.

## Fluxo de autenticação

- **Cadastro** (`cadastrarLojista`, em `src/lib/actions/auth-actions.ts`):
  cria o usuário via **Admin API do Supabase** (`auth.admin.createUser` com
  `email_confirm: true`), não via `signUp()` client-side. Isso é
  intencional: o projeto Supabase tem `mailer_autoconfirm: false` (e-mail de
  confirmação obrigatório por padrão), o que faria `signUp()` não retornar
  sessão nenhuma até o e-mail ser confirmado — quebrando o redirecionamento
  automático para o painel — e sujeitaria o fluxo ao rate limit de envio de
  e-mail do provedor. Depois de criar o usuário já confirmado, o
  provisionamento no Postgres (loja, membro, plano trial, chave de API)
  ocorre em uma transação atômica, e só então a sessão é aberta com
  `signInWithPassword()`.
- **Login / Logout**: Server Actions simples via `@supabase/ssr`.
- **Recuperação de senha**: fluxo PKCE completo — `solicitarRecuperacaoSenha()`
  dispara e-mail com link para `/auth/callback`, que troca o `code` por
  sessão e redireciona para `/redefinir-senha`, onde `redefinirSenha()`
  atualiza a senha do usuário já autenticado.
- **Estrutura pronta para 2FA**: campo `dois_fatores_habilitado` já existe em
  `usuarios`, mas a implementação de 2FA fica para uma etapa futura.
- **Proteção de rotas**: `src/proxy.ts` (convenção do Next.js 16, substitui o
  antigo `middleware.ts`) atualiza a sessão em todo request e redireciona
  usuários não autenticados tentando acessar `/painel/*` para `/login`.

## Setup local

### 1. Pré-requisitos

- Node.js 20+
- Um projeto Supabase já criado (Postgres + Auth)

### 2. Variáveis de ambiente

Crie `.env.local` na raiz do projeto com estas **6 variáveis**:

```bash
# URL pública do projeto Supabase
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co

# Chave pública/anon (usada no browser e em Server Components para sessão)
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxxxxxxxxxxxxxxxxxxxxxxx

# Chave service_role (NUNCA expor no browser; só em código server-side)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# Conexão via pooler Supavisor (transaction mode, porta 6543) — usada pela
# maior parte do runtime da aplicação e pelo Drizzle Kit para introspecção
DATABASE_URL=postgresql://postgres.SEU-PROJETO:SENHA@aws-0-REGIAO.pooler.supabase.com:6543/postgres

# Conexão via pooler Supavisor (session mode, porta 5432) — usada pelas
# migrações do Drizzle Kit (DDL não funciona bem em transaction mode)
DIRECT_URL=postgresql://postgres.SEU-PROJETO:SENHA@aws-0-REGIAO.pooler.supabase.com:5432/postgres

# Conexão com a role app_runtime (SEM bypass de RLS) — usada por toda query
# tenant-scoped da aplicação em runtime (ver seção de arquitetura acima)
RUNTIME_DATABASE_URL=postgresql://app_runtime.SEU-PROJETO:SENHA_RUNTIME@aws-0-REGIAO.pooler.supabase.com:6543/postgres

# URL pública da aplicação (usada para montar links de e-mail/callback)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Sobre a conexão IPv6**: o host `db.SEU-PROJETO.supabase.co` (conexão
> direta) só resolve em IPv6 em muitos projetos Supabase novos. Se seu
> ambiente (ou a Vercel) só tem saída IPv4, use sempre o **pooler Supavisor**
> (`aws-0-REGIAO.pooler.supabase.com`) como nos exemplos acima — descubra a
> região correta do seu projeto no painel do Supabase, em
> *Settings → Database → Connection string*.

> **Sobre a role `app_runtime`**: crie-a manualmente uma vez, sem
> `SUPERUSER`/`BYPASSRLS`, e conceda a ela os privilégios necessários nas
> tabelas do schema `public` (ver `drizzle/migrations/0001_rls_policies.sql`,
> que já inclui os `GRANT`s). Nunca use a role `postgres` (superuser) em
> runtime de produção.

### 3. Instalar dependências e aplicar migrações

```bash
npm install

# Aplica o schema (15 tabelas) via Drizzle Kit, usando DIRECT_URL
npx drizzle-kit push

# Aplica as políticas de RLS (arquivo SQL dedicado)
psql "$DIRECT_URL" -f drizzle/migrations/0001_rls_policies.sql
```

### 4. Rodar em desenvolvimento

```bash
npm run build   # gera public/widget.js minificado + build do Next.js
npm run dev      # ou, no sandbox: pm2 start ecosystem.config.cjs
```

A aplicação sobe em `http://localhost:3000`.

### 5. Lint e build de produção

```bash
npm run lint    # ESLint — deve terminar sem erros nem warnings
npm run build   # build de produção completo (Next.js + widget minificado)
```

## Testando o widget em uma "loja externa"

O widget (`public/widget.js`, gerado a partir de `widget-src/widget.js` via
`npm run build:widget`) foi desenhado para ser colado, via GTM, em **qualquer
página HTML** fora deste projeto. Para testar isso localmente:

1. Suba a aplicação (`npm run dev` ou PM2) e acesse `/painel/instalacao` já
   logado como lojista — copie o snippet de instalação (já vem com sua
   chave pública embutida).
2. Crie um arquivo HTML simples em qualquer lugar (fora deste projeto),
   colando o snippet copiado dentro de `<body>`, por exemplo:
   ```html
   <!DOCTYPE html>
   <html lang="pt-BR">
   <head><meta charset="utf-8"><title>Minha Loja de Teste</title></head>
   <body>
     <h1>Loja de teste</h1>
     <script>window.dataLayer = window.dataLayer || [];</script>
     <!-- cole aqui o snippet copiado da tela de Instalação -->
   </body>
   </html>
   ```
3. Sirva esse arquivo com qualquer servidor estático (ex.:
   `python3 -m http.server 8899`) e abra no navegador.
4. Interaja com a página (clique, scroll ou mova o mouse) — o widget usa
   **lazy-init**: o pop-up só monta na primeira interação do usuário, ou
   após 5 segundos de inatividade, o que ocorrer primeiro (para não
   impactar o LCP da página).
5. Preencha e envie o formulário do pop-up (renderizado em **Shadow DOM**,
   isolado do CSS da página host). Isso deve:
   - Disparar `POST /v1/leads` contra a aplicação (CORS liberado nesse
     endpoint especificamente, pois é consumido por domínios externos).
   - Empurrar um evento `lead_captured` para `window.dataLayer`.
   - Gravar um cookie first-party (`gmf_convertido`) para não mostrar o
     pop-up de novo ao mesmo visitante.
6. Volte ao painel (`/painel/leads`) — o lead deve aparecer na listagem, e
   pode ser exportado em CSV pelo botão "Exportar CSV".

### Testando o rate limiting

O endpoint `POST /v1/leads` aceita no máximo **5 requisições por
loja+IP a cada janela de 10 minutos** (tabela `limites_de_taxa`). A 6ª
requisição no período retorna `429`.

### Testando o honeypot anti-bot

O formulário do widget tem um campo oculto `empresa` (fora da área visível
via CSS, `tabindex="-1"`). Se ele vier preenchido no `POST /v1/leads`
(indício de bot automatizado), o endpoint retorna `201` com sucesso
**fingido** — não grava o lead, não avisa o remetente de que foi detectado.

## Resumo dos endpoints/rotas principais

| Rota | Método | Autenticação | Descrição |
|---|---|---|---|
| `/cadastro`, `/login`, `/recuperar-senha`, `/redefinir-senha` | páginas | pública | Fluxo de autenticação do lojista |
| `/auth/callback` | `GET` | pública (código PKCE) | Troca `code` por sessão (recuperação de senha) |
| `/painel` | página | sessão + loja | Dashboard com métricas zeradas e onboarding |
| `/painel/instalacao` | página | sessão + loja | Snippet GTM, chaves de API, regeneração de chave secreta |
| `/painel/leads` | página | sessão + loja | Listagem de leads capturados |
| `/painel/leads/exportar` | `GET` | sessão + loja | Exportação de leads em CSV (streaming, BOM UTF-8) |
| `/painel/campanhas`, `/painel/relatorios`, `/painel/configuracoes` | páginas | sessão + loja | Placeholders desta etapa |
| `/v1/leads` | `POST` | chave pública da loja (header `X-Gamifica-Public-Key`) | Endpoint público de captura de lead, consumido pelo widget |
| `/widget.js` | `GET` | pública | Script do widget, servido como asset estático |

## Guia rápido de uso (lojista)

1. Acesse `/cadastro` e crie sua conta (nome, nome da loja, e-mail, senha).
   Você já entra direto no painel — não precisa confirmar e-mail nesta etapa.
2. No painel, vá em **Instalação** e copie o snippet do Google Tag Manager.
3. No GTM da sua loja, crie uma tag "HTML personalizado" com esse snippet,
   acionada em "Todas as páginas", e publique o contêiner.
4. Os leads capturados pelo pop-up de demonstração aparecem em **Leads**,
   de onde também é possível exportar tudo em CSV.
5. Em **Configurações**, você vê os dados da sua conta e da sua loja.

## Deploy em produção (Vercel)

1. Importe este repositório GitHub (`ravmkt/gamificacao`) no painel da
   [Vercel](https://vercel.com/new).
2. Configure as **6 variáveis de ambiente** listadas na seção *Setup local*
   em *Project Settings → Environment Variables* (ambiente "Production" e
   "Preview"). Ajuste `NEXT_PUBLIC_APP_URL` para o domínio real de produção
   (ex.: `https://gamifica-ecommerce.vercel.app`).
3. Framework preset: **Next.js** (detectado automaticamente).
4. Rode as migrações de banco (`npx drizzle-kit push` +
   `psql "$DIRECT_URL" -f drizzle/migrations/0001_rls_policies.sql`) contra o
   banco de produção **antes** do primeiro deploy, usando as credenciais de
   produção do Supabase.
5. Clique em **Deploy**. A Vercel builda com `npm run build` (que já roda
   `npm run build:widget` antes do build do Next.js).
6. Depois do primeiro deploy, atualize a URL do site no painel do Supabase em
   *Authentication → URL Configuration* (Site URL + Redirect URLs) para
   incluir o domínio de produção — necessário para o fluxo de recuperação
   de senha funcionar corretamente.

## O que ainda não foi implementado (fora do escopo desta etapa)

- Mecânicas reais de gamificação: raspadinha, roleta, quiz, pontos/fidelidade,
  sorteios.
- Testes A/B de campanhas.
- Automações de carrinho abandonado.
- Área do consumidor final (histórico de cupons, etc.).
- Geração/validação automática de cupons a partir de campanhas.
- Configuração de webhooks pela UI (a infraestrutura de entrega — tabela
  `webhook_entregas`, assinatura HMAC, timeout de 5s — já está pronta no
  backend; falta só o CRUD de webhooks na tela de Instalação).
- Fila assíncrona de reentrega de webhooks (hoje a entrega é síncrona,
  best-effort, com um único disparo por evento — ver `TODO` em
  `src/lib/webhooks.ts`).
- Autenticação em duas etapas (2FA) — campo já existe no schema, sem lógica.
- Seletor de múltiplas lojas por usuário (hoje cada lojista tem exatamente
  uma loja).

## Próximos passos recomendados

1. Validar o deploy de produção na Vercel com as migrações já aplicadas no
   banco de produção do Supabase.
2. Revisar as políticas de RLS (`drizzle/migrations/0001_rls_policies.sql`)
   com um segundo par de olhos antes de abrir a plataforma para lojistas
   reais.
3. Iniciar a **Etapa 2**: mecânicas de gamificação (raspadinha/roleta),
   motor de cupons, barra de progresso e campanhas de UTM/indicação —
   apenas após esta Etapa 1 estar validada em produção.

---

Última atualização: Etapa 1.5 (fechamento da fundação) — cadastro, login,
recuperação de senha, painel, instalação/integrações, widget embarcável,
captura pública de leads, exportação CSV e auditoria completos e testados
end-to-end via browser real.
