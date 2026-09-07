import { api } from "../lib/api";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "ASSEMBLER" | "ANALYST";
  active: boolean;
  tenantName: string;
  ticketsTotal: number;
  ticketsHoje: number;
}

export interface CreateTeamMemberInput {
  name: string;
  email: string;
  password: string;
}

export const teamService = {
  async getAll(): Promise<TeamMember[]> {
    try {
      const response = await api.get<TeamMember[]>("/users/team");
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar equipe:", error);
      return [];
    }
  },

  async createAssembler(data: CreateTeamMemberInput) {
    const response = await api.post("/users/assemblers", data);
    return response.data.assembler;
  },

  async createAnalyst(data: CreateTeamMemberInput) {
    const response = await api.post("/users/analysts", data);
    return response.data.analyst;
  },
};
