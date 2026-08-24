import { api } from "../lib/api";

export interface Montador {
  id: string;
  nome: string;
  equipe: string;
  cidade: string;
  uf: string;
  especialidade: string;
  status: "DISPONIVEL" | "INATIVO";
  ultimaLocalizacao: string;
  ticketsHoje: number;
  ticketsMes: number;
  taxaErro: number;
  nps: number;
  telefone: string;
}

export const montadoresService = {
  async getAll(): Promise<Montador[]> {
    try {
      const response = await api.get<any[]>("/api/v1/montadores");

      return response.data.map((item) => ({
        id: item.id,
        nome: item.name || "Montador",
        equipe: item.tenantName || "Equipe",
        cidade: "Não informada",
        uf: "UF",
        especialidade: "Montagem de Móveis",
        status: item.active ? "DISPONIVEL" : "INATIVO",
        ultimaLocalizacao: "Em trânsito",
        ticketsHoje: item.ticketsHoje || 0,
        ticketsMes: item.ticketsTotal || 0,
        taxaErro: 0,
        nps: 100,
        telefone: item.email || "",
      }));
    } catch (error) {
      console.error("🔴 Erro ao buscar montadores do banco:", error);
      return []; // Retorna lista vazia em caso de erro, garantindo zero mocks
    }
  },
};
