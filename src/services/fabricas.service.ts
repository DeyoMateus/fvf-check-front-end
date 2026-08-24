import { api } from "../lib/api";
import { FABRICAS_MOCK, type Fabrica } from "../lib/pagesData";

export type { Fabrica };

/**
 * Função utilitária para transformar os dados puros vindo do Backend (Prisma/Fastify)
 * no formato exato que a interface Fabrica da UI do React precisa.
 */
function mapBackendFabricaToUI(item: any): Fabrica {
  return {
    id: item.id,
    // Trata 'name' (do Tenant Prisma) ou 'nome'
    nome: item.nome || item.name || "Fábrica Sem Nome",

    // Trata 'document' (do Tenant Prisma) ou 'cnpj'
    cnpj: item.cnpj || item.document || "00.000.000/0001-00",

    cidade: item.cidade || "Não informada",
    uf: item.uf || "UF",

    // Mapeia a especialidade ou o planType da empresa
    especialidade: item.especialidade || item.planType || "Geral",

    // Mapeia o boolean 'active' do Prisma para os status visuais da UI
    status: item.status || (item.active === false ? "SUSPENSA" : "ATIVA"),

    slaMedioHoras: item.slaMedioHoras ?? 24,

    // Puxa do total de tickets no _count ou de rmaAbertos
    rmaAbertos: item.rmaAbertos ?? item._count?.tickets ?? 0,

    taxaDefeito: item.taxaDefeito ?? 0,
    lotesAtivos: item.lotesAtivos ?? 0,
    contato: item.contato || item.email || "contato@fabrica.com",
    scoreQualidade: item.scoreQualidade ?? 100,
  };
}

export const fabricasService = {
  async getAll(): Promise<Fabrica[]> {
    try {
      // Ajuste o endpoint se necessário: "/api/v1/fabricas" ou "/fabricas"
      const response = await api.get<any[]>("/api/v1/fabricas");

      // Mapeia cada fábrica recebida para garantir compatibility com o Front
      return response.data.map(mapBackendFabricaToUI);
    } catch (error) {
      console.warn(
        "⚠️ Rota GET /api/v1/fabricas não disponível ou erro na requisição. Utilizando MOCK temporário.",
      );
      return FABRICAS_MOCK;
    }
  },

  async getById(id: string): Promise<Fabrica | undefined> {
    try {
      const response = await api.get<any>(`/api/v1/fabricas/${id}`);
      return mapBackendFabricaToUI(response.data);
    } catch (error) {
      console.warn(
        `⚠️ Rota GET /api/v1/fabricas/${id} indisponível. Buscando no MOCK.`,
      );
      return FABRICAS_MOCK.find((f) => f.id === id);
    }
  },
};
