import { api } from "../lib/api"; // Ajuste o import do axios conforme o seu projeto

export interface Montador {
  id: string;
  nome: string; // Mapeado de 'name'
  email: string;
  telefone: string; // Como o backend retorna email/tenantName, podemos adaptar ou deixar genérico
  equipe: string; // Mapeado de 'tenantName'
  status: "DISPONIVEL" | "INATIVO"; // Mapeado do booleano 'active'
  ticketsHoje: number;
  ticketsMes: number; // Mapeado de 'ticketsTotal'
  taxaErro: number;
  nps: number;
}

export const montadoresService = {
  async getAll(): Promise<Montador[]> {
    // Rota correta exposta no managementRoutes.ts do backend:
    const response = await api.get("/users/assemblers");

    // Mapeia os dados vindos do backend para o formato esperado pelo componente frontend
    return response.data.map((item: any) => ({
      id: item.id,
      nome: item.name,
      email: item.email,
      telefone: item.email, // Caso não tenha telefone cadastrado no User, exibe o email provisoriamente
      equipe: item.tenantName,
      status: item.active ? "DISPONIVEL" : "INATIVO",
      ticketsHoje: item.ticketsHoje || 0,
      ticketsMes: item.ticketsTotal || 0,
      taxaErro: 1.2, // Valor padrão ou vindo da API se houver
      nps: 98, // Valor padrão ou vindo da API se houver
    }));
  },

  async create(data: { name: string; email: string; password: string }) {
    // Rota correspondente de cadastro de montador no backend
    const response = await api.post("/users/assemblers", data);
    return response.data;
  },
};
