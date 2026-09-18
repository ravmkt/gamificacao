import { eq, desc, inArray } from 'drizzle-orm';
import { withTenantContext } from '@/db/tenant-context';
import { schema } from '@/db';

export type LeadComConsentimentos = {
  id: string;
  nome: string | null;
  email: string | null;
  telefone: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  status: string;
  criadoEm: Date;
  consentimentoParticipacao: boolean | null;
  consentimentoMarketing: boolean | null;
};

/**
 * Busca leads da loja (dentro do contexto RLS) com seus consentimentos
 * agregados. Usado tanto pela listagem no painel quanto pela exportação CSV.
 */
export async function buscarLeadsDaLoja(
  lojaId: string,
  usuarioId: string,
  limite?: number
): Promise<LeadComConsentimentos[]> {
  return withTenantContext(lojaId, usuarioId, async (tx) => {
    const baseQuery = tx
      .select({
        id: schema.leads.id,
        nome: schema.leads.nome,
        email: schema.leads.email,
        telefone: schema.leads.telefone,
        utmSource: schema.leads.utmSource,
        utmMedium: schema.leads.utmMedium,
        utmCampaign: schema.leads.utmCampaign,
        status: schema.leads.status,
        criadoEm: schema.leads.criadoEm,
      })
      .from(schema.leads)
      .where(eq(schema.leads.lojaId, lojaId))
      .orderBy(desc(schema.leads.criadoEm));

    const leads = limite ? await baseQuery.limit(limite) : await baseQuery;

    if (leads.length === 0) return [];

    const leadIds = leads.map((l) => l.id);
    const consentimentos = await tx
      .select({
        leadId: schema.consentimentos.leadId,
        tipo: schema.consentimentos.tipo,
        aceito: schema.consentimentos.aceito,
      })
      .from(schema.consentimentos)
      .where(inArray(schema.consentimentos.leadId, leadIds));

    const mapaConsentimentos = new Map<string, { participacao?: boolean; marketing?: boolean }>();
    for (const c of consentimentos) {
      const atual = mapaConsentimentos.get(c.leadId) ?? {};
      if (c.tipo === 'participacao_campanha') atual.participacao = c.aceito;
      if (c.tipo === 'marketing') atual.marketing = c.aceito;
      mapaConsentimentos.set(c.leadId, atual);
    }

    return leads.map((l) => {
      const consent = mapaConsentimentos.get(l.id);
      return {
        ...l,
        consentimentoParticipacao: consent?.participacao ?? null,
        consentimentoMarketing: consent?.marketing ?? null,
      };
    });
  });
}
