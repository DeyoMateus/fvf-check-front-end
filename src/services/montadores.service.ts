import { api } from "../lib/api";

export interface Montador {
  id: string;
  name: string;
  email: string;
  active: boolean;
  role: "ASSEMBLER";
  team?: string;
  ticketsToday: number;
  ticketsMonth: number;
  errorRate: number;
  nps: number;
}

export interface CreateMontadorInput {
  name: string;
  email: string;
  password: string;
}

// Mapper para garantir consistência entre a resposta da API e a UI
function mapBackendAssemblerToUI(item: any): Montador {
  return {
    id: item.id,
    name: item.name || item.nome || "Montador",
    email: item.email || "",
    active: item.active ?? true,
    role: "ASSEMBLER",
    team: item.team || item.equipe || "Geral",
    ticketsToday: item.ticketsToday ?? item._count?.ticketsToday ?? 0,
    ticketsMonth: item.ticketsMonth ?? item._count?.ticketsMonth ?? 0,
    errorRate: item.errorRate ?? 0,
    nps: item.nps ?? 100,
  };
}

export const montadoresService = {
  async getAll(): Promise<Montador[]> {
    try {
      // Consome a rota do Fastify registrada em routes.ts (/users/assemblers)
      const response = await api.get<any[]>("/users/assemblers");
      return response.data.map(mapBackendAssemblerToUI);
    } catch (error) {
      console.error("Erro ao buscar montadores do banco de dados:", error);
      return [];
    }
  },

  async create(data: CreateMontadorInput): Promise<Montador> {
    // Consome a rota POST /users/assemblers do Fastify
    const response = await api.post("/users/assemblers", data);
    return mapBackendAssemblerToUI(response.data.assembler || response.data);
  },
};
