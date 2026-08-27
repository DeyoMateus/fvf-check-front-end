import { api } from "../lib/api";

export interface Fabrica {
  id: string;
  nome: string;
  cnpj: string;
  cidade: string;
  uf: string;
  especialidade: string;
  status: "ATIVA" | "EM_AUDITORIA" | "SUSPENSA";
  slaMedioHoras: number;
  rmaAbertos: number;
  taxaDefeito: number;
  lotesAtivos: number;
  contato: string;
  scoreQualidade: number;
}

function mapBackendFabricaToUI(item: any): Fabrica {
  return {
    id: item.id,
    nome: item.name || "Fábrica Sem Nome",
    cnpj: item.document || "00.000.000/0001-00",
    cidade: item.cidade || "Não informada",
    uf: item.uf || "UF",
    especialidade: item.especialidade || item.planType || "Geral",
    status: item.status || (item.active === false ? "SUSPENSA" : "ATIVA"),
    slaMedioHoras: item.slaMedioHoras ?? 24,
    rmaAbertos: item.rmaAbertos ?? item._count?.tickets ?? 0,
    taxaDefeito: item.taxaDefeito ?? 0,
    lotesAtivos: item.lotesAtivos ?? 0,
    contato: item.email || item.contato || "contato@fabrica.com",
    scoreQualidade: item.scoreQualidade ?? 100,
  };
}

export const fabricasService = {
  async getAll(): Promise<Fabrica[]> {
    try {
      // Ajuste conforme o padrão das outras rotas que funcionam (como /tickets)
      const response = await api.get<any[]>("/fabricas");
      return response.data.map(mapBackendFabricaToUI);
    } catch (error) {
      console.error("Erro ao carregar fábricas do banco de dados:", error);
      return [];
    }
  },

  async getById(id: string): Promise<Fabrica | undefined> {
    try {
      const response = await api.get<any>(`/fabricas/${id}`);
      return mapBackendFabricaToUI(response.data);
    } catch (error) {
      console.error(`Erro ao carregar fábrica ${id}:`, error);
      return undefined;
    }
  },
};
