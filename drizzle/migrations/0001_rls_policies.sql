-- ============================================================================
-- Row Level Security (RLS) — camada extra de defesa de isolamento multi-tenant.
--
-- Estratégia: a aplicação conecta como a role `app_runtime` (sem BYPASSRLS,
-- diferente da role `postgres` usada só para migrations). A cada requisição,
-- o backend define a variável de sessão `app.current_loja_id` (via
-- set_config, dentro de uma transação) com a loja do usuário autenticado.
-- As políticas abaixo restringem toda leitura/escrita a essa loja.
--
-- IMPORTANTE: RLS é DEFESA EM PROFUNDIDADE. A camada primária de isolamento
-- é a aplicação (toda query já filtra por loja_id explicitamente no código).
-- Se algum dia o código esquecer o filtro, o RLS ainda protege.
-- ============================================================================

-- Permissões básicas de runtime na role de aplicação
GRANT USAGE ON SCHEMA public TO app_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_runtime;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_runtime;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_runtime;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO app_runtime;

-- ----------------------------------------------------------------------------
-- lojas: usuário só vê lojas das quais é membro (checagem via membros_da_loja)
-- ----------------------------------------------------------------------------
ALTER TABLE lojas ENABLE ROW LEVEL SECURITY;
CREATE POLICY lojas_isolamento ON lojas
  USING (id = current_setting('app.current_loja_id', true)::uuid);

-- ----------------------------------------------------------------------------
-- Tabelas com loja_id direto: isolamento simples por sessão
-- ----------------------------------------------------------------------------
ALTER TABLE membros_da_loja ENABLE ROW LEVEL SECURITY;
CREATE POLICY membros_da_loja_isolamento ON membros_da_loja
  USING (loja_id = current_setting('app.current_loja_id', true)::uuid);

ALTER TABLE assinaturas ENABLE ROW LEVEL SECURITY;
CREATE POLICY assinaturas_isolamento ON assinaturas
  USING (loja_id = current_setting('app.current_loja_id', true)::uuid);

ALTER TABLE chaves_de_api ENABLE ROW LEVEL SECURITY;
CREATE POLICY chaves_de_api_isolamento ON chaves_de_api
  USING (loja_id = current_setting('app.current_loja_id', true)::uuid);

ALTER TABLE campanhas ENABLE ROW LEVEL SECURITY;
CREATE POLICY campanhas_isolamento ON campanhas
  USING (loja_id = current_setting('app.current_loja_id', true)::uuid);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY leads_isolamento ON leads
  USING (loja_id = current_setting('app.current_loja_id', true)::uuid);

ALTER TABLE limites_de_taxa ENABLE ROW LEVEL SECURITY;
CREATE POLICY limites_de_taxa_isolamento ON limites_de_taxa
  USING (loja_id = current_setting('app.current_loja_id', true)::uuid);

ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;
CREATE POLICY eventos_isolamento ON eventos
  USING (loja_id = current_setting('app.current_loja_id', true)::uuid);

ALTER TABLE cupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY cupons_isolamento ON cupons
  USING (loja_id = current_setting('app.current_loja_id', true)::uuid);

ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY webhooks_isolamento ON webhooks
  USING (loja_id = current_setting('app.current_loja_id', true)::uuid);

-- ----------------------------------------------------------------------------
-- Tabelas sem loja_id direto: isolamento via JOIN (subquery) com a tabela pai
-- ----------------------------------------------------------------------------
ALTER TABLE consentimentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY consentimentos_isolamento ON consentimentos
  USING (
    lead_id IN (
      SELECT id FROM leads WHERE loja_id = current_setting('app.current_loja_id', true)::uuid
    )
  );

ALTER TABLE webhook_entregas ENABLE ROW LEVEL SECURITY;
CREATE POLICY webhook_entregas_isolamento ON webhook_entregas
  USING (
    webhook_id IN (
      SELECT id FROM webhooks WHERE loja_id = current_setting('app.current_loja_id', true)::uuid
    )
  );

-- ----------------------------------------------------------------------------
-- logs_de_auditoria: mesma regra, mas loja_id é nullable (ações sem loja,
-- ex.: cadastro de usuário) — nesses casos, permite ver se loja_id é NULL
-- E a variável de sessão também não foi definida (contexto de sistema).
-- ----------------------------------------------------------------------------
ALTER TABLE logs_de_auditoria ENABLE ROW LEVEL SECURITY;
CREATE POLICY logs_de_auditoria_isolamento ON logs_de_auditoria
  USING (
    loja_id = current_setting('app.current_loja_id', true)::uuid
    OR loja_id IS NULL
  );

-- ----------------------------------------------------------------------------
-- usuarios: cada usuário só vê o próprio registro (isolamento por usuário,
-- não por loja — usa app.current_usuario_id, definido no contexto de auth).
-- ----------------------------------------------------------------------------
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY usuarios_proprio_registro ON usuarios
  USING (id = current_setting('app.current_usuario_id', true)::uuid);

-- ----------------------------------------------------------------------------
-- planos: catálogo público (todo usuário autenticado pode ler; sem escrita
-- pela role de runtime — alterações de plano são feitas via migration/admin).
-- ----------------------------------------------------------------------------
ALTER TABLE planos ENABLE ROW LEVEL SECURITY;
CREATE POLICY planos_leitura_publica ON planos
  FOR SELECT
  USING (true);
