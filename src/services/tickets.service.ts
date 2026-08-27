import { api } from "../lib/api";
import { Ticket, CreateTicketDTO } from "../lib/types";
import { TICKETS_MOCK } from "../lib/mockData";

export const ticketsService = {
  async getAll(): Promise<Ticket[]> {
    try {
      const response = await api.get<any[]>("/tickets");

      return response.data.map((item) => ({
        id: item.id,
        code: item.code,
        tenantId: item.tenantId,
        invoiceId: item.invoiceId,
        productId: item.productId,
        createdById: item.createdById,
        description: item.description,
        status: item.status,
        suggestedResponsibility: item.suggestedResponsibility ?? null,
        severity: item.severity ?? "MEDIUM",
        customerName: item.createdBy?.name ?? item.invoice?.customer?.name,
        cityName: item.invoice?.customer?.address?.city,
        nfeKey: item.invoice?.nfeKey,
        batchNumber: item.invoice?.batchNumber,
        parts: item.parts ?? [],
        scores: item.scores,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        slaHours: item.slaHours ?? 24,
        assignedUser: item.assignedTo?.name,
      }));
    } catch (error) {
      console.warn(
        "⚠️ Rota /tickets com erro no Backend. Utilizando MOCK temporário.",
      );
      return TICKETS_MOCK;
    }
  },

  async create(data: CreateTicketDTO | FormData): Promise<Ticket> {
    try {
      const response = await api.post<Ticket>("/tickets", data, {
        headers:
          data instanceof FormData
            ? { "Content-Type": "multipart/form-data" }
            : undefined,
      });
      return response.data;
    } catch (error) {
      console.warn(
        "⚠️ Falha ao conectar ao servidor. Simulado envio local do chamado.",
        error,
      );

      // Leitura tratada para objeto ou FormData no modo Mock/Offline
      const isForm = data instanceof FormData;
      const customerName = isForm
        ? (data.get("invoice[customer][name]") as string) || "Consumidor Teste"
        : data.invoice?.customerName;
      const suggestedResp = isForm
        ? (data.get("suggestedResponsibility") as any)
        : data.suggestedResponsibility;

      const mockCreatedTicket: Ticket = {
        id: `ticket-${Date.now()}`,
        code: `FVF-${Math.floor(100000 + Math.random() * 900000)}`,
        status: "OPEN",
        suggestedResponsibility: suggestedResp,
        customerName: customerName,
        batchNumber: "LT-LOCAL",
        description: isForm
          ? (data.get("parts[0][emergencyNotes]") as string)
          : data.description,
        severity: "MEDIUM",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return mockCreatedTicket;
    }
  },
};
