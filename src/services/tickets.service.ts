import { api } from "../lib/api";
import { Ticket } from "../lib/types";
import { TICKETS_MOCK } from "../lib/mockData";

export const ticketsService = {
  async getAll(): Promise<Ticket[]> {
    try {
      const response = await api.get<any[]>("/tickets");

      // Mapeia o payload vindo do Backend para a estrutura esperada nos componentes
      return response.data.map((item) => ({
        id: item.code ?? item.id,
        cliente: item.createdBy?.name ?? "Cliente não informado",
        cidade: item.invoice?.cidade ?? "Não especificada",
        danfe: item.invoice?.number
          ? `NF-e ${item.invoice.number}`
          : "Sem NF-e",
        lote: item.lote ?? "N/A",
        status: item.status,
        responsabilidade: item.suggestedResponsibility ?? "PENDENTE",
        severidade: item.severity ?? "MEDIA",
        scores: item.scores ?? { transporte: 0, fabrica: 0, montagem: 0 },
        pecas: item.parts ?? [],
        abertoEm: item.createdAt,
        slaHoras: item.slaHoras ?? 24,
        responsavel: item.assignedTo?.name,
      }));
    } catch (error) {
      console.warn(
        "⚠️ Rota /tickets com erro no Backend. Utilizando MOCK temporário.",
      );
      return TICKETS_MOCK;
    }
  },
};
