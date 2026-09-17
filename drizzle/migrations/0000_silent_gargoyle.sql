CREATE TYPE "public"."papel_membro" AS ENUM('proprietario', 'administrador', 'somente_leitura');--> statement-breakpoint
CREATE TYPE "public"."status_assinatura" AS ENUM('trial', 'ativa', 'inadimplente', 'cancelada');--> statement-breakpoint
CREATE TYPE "public"."status_campanha" AS ENUM('rascunho', 'ativa', 'pausada', 'encerrada');--> statement-breakpoint
CREATE TYPE "public"."status_convite" AS ENUM('pendente', 'aceito', 'revogado');--> statement-breakpoint
CREATE TYPE "public"."status_cupom" AS ENUM('ativo', 'esgotado', 'expirado', 'cancelado');--> statement-breakpoint
CREATE TYPE "public"."status_entrega_webhook" AS ENUM('pendente', 'enviado', 'falhou');--> statement-breakpoint
CREATE TYPE "public"."status_lead" AS ENUM('novo', 'processado', 'invalido', 'spam');--> statement-breakpoint
CREATE TYPE "public"."status_loja" AS ENUM('ativa', 'suspensa', 'cancelada');--> statement-breakpoint
CREATE TYPE "public"."tipo_consentimento" AS ENUM('participacao_campanha', 'marketing');--> statement-breakpoint
CREATE TABLE "usuarios" (
	"id" uuid PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"email" text NOT NULL,
	"dois_fatores_habilitado" boolean DEFAULT false NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lojas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"slug" text NOT NULL,
	"dominio" text,
	"status" "status_loja" DEFAULT 'ativa' NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lojas_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "membros_da_loja" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"loja_id" uuid NOT NULL,
	"usuario_id" uuid NOT NULL,
	"papel" "papel_membro" DEFAULT 'administrador' NOT NULL,
	"convite_status" "status_convite" DEFAULT 'aceito' NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assinaturas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"loja_id" uuid NOT NULL,
	"plano_id" uuid NOT NULL,
	"status" "status_assinatura" DEFAULT 'trial' NOT NULL,
	"iniciada_em" timestamp with time zone DEFAULT now() NOT NULL,
	"expira_em" timestamp with time zone,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "planos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"slug" text NOT NULL,
	"limites" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"preco_centavos" integer DEFAULT 0 NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "planos_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "chaves_de_api" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"loja_id" uuid NOT NULL,
	"chave_publica" text NOT NULL,
	"chave_secreta_hash" text NOT NULL,
	"secreta_ultimos4" text NOT NULL,
	"ativa" boolean DEFAULT true NOT NULL,
	"criada_em" timestamp with time zone DEFAULT now() NOT NULL,
	"revogada_em" timestamp with time zone,
	CONSTRAINT "chaves_de_api_chave_publica_unique" UNIQUE("chave_publica")
);
--> statement-breakpoint
CREATE TABLE "campanhas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"loja_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"tipo" text DEFAULT 'generica' NOT NULL,
	"status" "status_campanha" DEFAULT 'rascunho' NOT NULL,
	"regras" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"inicio_em" timestamp with time zone,
	"fim_em" timestamp with time zone,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consentimentos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"tipo" "tipo_consentimento" NOT NULL,
	"aceito" boolean NOT NULL,
	"versao_termo" text NOT NULL,
	"ip_hash" text,
	"user_agent" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"loja_id" uuid NOT NULL,
	"campanha_id" uuid,
	"nome" text,
	"email" text,
	"telefone" text,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text,
	"utm_term" text,
	"utm_content" text,
	"ip_hash" text,
	"user_agent" text,
	"status" "status_lead" DEFAULT 'novo' NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "limites_de_taxa" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"loja_id" uuid NOT NULL,
	"ip_hash" text NOT NULL,
	"janela_inicio" timestamp with time zone NOT NULL,
	"contagem" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "eventos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"loja_id" uuid NOT NULL,
	"tipo" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"lead_id" uuid,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cupons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"loja_id" uuid NOT NULL,
	"campanha_id" uuid,
	"codigo" text NOT NULL,
	"tipo_desconto" text DEFAULT 'percentual' NOT NULL,
	"valor" integer DEFAULT 0 NOT NULL,
	"limite_uso" integer,
	"usos_atuais" integer DEFAULT 0 NOT NULL,
	"valido_de" timestamp with time zone,
	"valido_ate" timestamp with time zone,
	"status" "status_cupom" DEFAULT 'ativo' NOT NULL,
	"token_assinado" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_entregas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"webhook_id" uuid NOT NULL,
	"evento_tipo" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" "status_entrega_webhook" DEFAULT 'pendente' NOT NULL,
	"tentativas" integer DEFAULT 0 NOT NULL,
	"proxima_tentativa_em" timestamp with time zone,
	"resposta_http_status" integer,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhooks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"loja_id" uuid NOT NULL,
	"url" text NOT NULL,
	"eventos_assinados" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"segredo_assinatura" text NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "logs_de_auditoria" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"loja_id" uuid,
	"usuario_id" uuid,
	"acao" text NOT NULL,
	"entidade_tipo" text NOT NULL,
	"entidade_id" text,
	"detalhes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ip_hash" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membros_da_loja" ADD CONSTRAINT "membros_da_loja_loja_id_lojas_id_fk" FOREIGN KEY ("loja_id") REFERENCES "public"."lojas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membros_da_loja" ADD CONSTRAINT "membros_da_loja_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assinaturas" ADD CONSTRAINT "assinaturas_loja_id_lojas_id_fk" FOREIGN KEY ("loja_id") REFERENCES "public"."lojas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assinaturas" ADD CONSTRAINT "assinaturas_plano_id_planos_id_fk" FOREIGN KEY ("plano_id") REFERENCES "public"."planos"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chaves_de_api" ADD CONSTRAINT "chaves_de_api_loja_id_lojas_id_fk" FOREIGN KEY ("loja_id") REFERENCES "public"."lojas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campanhas" ADD CONSTRAINT "campanhas_loja_id_lojas_id_fk" FOREIGN KEY ("loja_id") REFERENCES "public"."lojas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consentimentos" ADD CONSTRAINT "consentimentos_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_loja_id_lojas_id_fk" FOREIGN KEY ("loja_id") REFERENCES "public"."lojas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_campanha_id_campanhas_id_fk" FOREIGN KEY ("campanha_id") REFERENCES "public"."campanhas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "limites_de_taxa" ADD CONSTRAINT "limites_de_taxa_loja_id_lojas_id_fk" FOREIGN KEY ("loja_id") REFERENCES "public"."lojas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eventos" ADD CONSTRAINT "eventos_loja_id_lojas_id_fk" FOREIGN KEY ("loja_id") REFERENCES "public"."lojas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eventos" ADD CONSTRAINT "eventos_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cupons" ADD CONSTRAINT "cupons_loja_id_lojas_id_fk" FOREIGN KEY ("loja_id") REFERENCES "public"."lojas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cupons" ADD CONSTRAINT "cupons_campanha_id_campanhas_id_fk" FOREIGN KEY ("campanha_id") REFERENCES "public"."campanhas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_entregas" ADD CONSTRAINT "webhook_entregas_webhook_id_webhooks_id_fk" FOREIGN KEY ("webhook_id") REFERENCES "public"."webhooks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_loja_id_lojas_id_fk" FOREIGN KEY ("loja_id") REFERENCES "public"."lojas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logs_de_auditoria" ADD CONSTRAINT "logs_de_auditoria_loja_id_lojas_id_fk" FOREIGN KEY ("loja_id") REFERENCES "public"."lojas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logs_de_auditoria" ADD CONSTRAINT "logs_de_auditoria_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE set null ON UPDATE no action;