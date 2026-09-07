import { api } from "../lib/api";
import { EMERGENCY_MEDIA_LABELS } from "../services/emergency.service";
import type {
  RequiredEmergencyMediaType,
  EmergencyStatusResponse,
} from "../services/emergency.service";
import type {
  ResponsibilityLabel,
  TicketStatus,
  Severity,
  PkgCondition,
  DefectType,
  MediaType,
  VisitStatus,
  ClaimStatus,
  RmaStatus,
  Media,
  TicketPart,
  TechnicalVisit,
  TransportClaim,
  FactoryRma,
  TicketEvent,
  CommentItem,
  Ticket,
  CreateTicketPayload,
  ReverseLogisticsStatus,
} from "../lib/types";
import {
  RESPONSIBILITY_LABELS,
  STATUS_LABELS,
  VISIT_STATUS_LABELS,
  CLAIM_STATUS_LABELS,
  RMA_STATUS_LABELS,
  SEVERITY_LABELS,
  STATUS_ORDER,
} from "../lib/types";

// Re-exporta tudo para manter compatibilidade com os componentes que já
// importam tipos e dicionários a partir deste arquivo de serviço
// (TicketDrawer, TicketDetailsModal, TicketsPage, CreateTicketModal).
// A fonte real dos tipos agora é exclusivamente ../lib/types.
export type {
  ResponsibilityLabel,
  TicketStatus,
  Severity,
  PkgCondition,
  DefectType,
  MediaType,
  VisitStatus,
  ClaimStatus,
  RmaStatus,
  Media,
  TicketPart,
  TechnicalVisit,
  TransportClaim,
  FactoryRma,
  TicketEvent,
  CommentItem,
  Ticket,
  CreateTicketPayload,
  RequiredEmergencyMediaType,
  EmergencyStatusResponse,
};
export {
  RESPONSIBILITY_LABELS,
  STATUS_LABELS,
  VISIT_STATUS_LABELS,
  CLAIM_STATUS_LABELS,
  RMA_STATUS_LABELS,
  SEVERITY_LABELS,
  STATUS_ORDER,
  EMERGENCY_MEDIA_LABELS,
};

export interface TrashedTicket extends Ticket {
  deletedAt: string;
  purgeAt: string;
  daysRemaining: number;
}

export const ticketsService = {
  async getAll(): Promise<Ticket[]> {
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
      suggestedResponsibility: item.suggestedResponsibility ?? undefined,
      isEmergencyMode: item.isEmergencyMode ?? false,
      reverseLogistics: item.reverseLogistics ?? "NONE",
      reverseLogisticsLabel: item.reverseLogisticsLabel ?? null,
      severity: item.severity ?? "MEDIUM",
      customerName: item.createdBy?.name ?? item.invoice?.customer?.name,
      customerPhone: item.invoice?.customer?.phone,
      cityName: item.invoice?.customer?.address?.city,
      nfeKey: item.invoice?.nfeKey,
      batchNumber: item.invoice?.batchNumber,
      product: item.product ?? null,
      packageCondition: item.packageCondition,
      parts: (item.parts ?? []).map((p: any) => ({
        ...p,
        media: (item.media ?? []).filter((m: any) => m.ticketPartId === p.id),
      })),
      mediaFiles: item.media ?? [],
      scores: item.scores,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      dueDate: item.dueDate,
      slaHours: item.slaHours ?? 24,
      assignedUser: item.assignedTo?.name,
      comments: (item.comments ?? []).map((c: any) => ({
        id: c.id,
        text: c.text,
        authorId: c.authorId,
        authorName: c.author?.name,
        createdAt: c.createdAt,
      })),
      technicalVisit: item.technicalVisit
        ? {
            id: item.technicalVisit.id,
            assemblerId: item.technicalVisit.assemblerId,
            assemblerName: item.technicalVisit.assembler?.name,
            scheduledAt: item.technicalVisit.scheduledAt,
            status: item.technicalVisit.status,
          }
        : null,
      transportClaim: item.transportClaim ?? null,
      factoryRma: item.factoryRma ?? null,
      events: item.events ?? [],
    }));
  },

  async create(data: CreateTicketPayload): Promise<Ticket> {
    // Sem fallback silencioso aqui: se a chamada falhar (rede offline ou
    // erro de validação do backend), o erro propaga para quem chamou.
    // A decisão de enfileirar offline agora vive no CreateTicketModal,
    // que sabe distinguir "sem internet" de "erro de validação real".
    const response = await api.post<{ message: string; ticket: Ticket }>(
      "/tickets",
      data,
    );
    const item = response.data.ticket || response.data;
    return {
      id: item.id,
      code: item.code,
      status: item.status,
      suggestedResponsibility: item.suggestedResponsibility,
      customerName: item.customerName,
      customerPhone: item.customerPhone,
      packageCondition: item.packageCondition,
      parts: item.parts,
      mediaFiles: item.mediaFiles,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      dueDate: item.dueDate,
      slaHours: item.slaHours ?? 24,
    } as Ticket;
  },

  async updateStatus(id: string, status: TicketStatus): Promise<void> {
    try {
      await api.patch(`/tickets/${id}/status`, { status });
    } catch {
      console.warn("⚠️ Atualização simulada em modo offline.");
    }
  },

  async addComment(id: string, text: string): Promise<void> {
    try {
      await api.post(`/tickets/${id}/comments`, { text });
    } catch (error) {
      console.warn("⚠️ Salvamento de nota simulado em modo offline.", error);
    }
  },

  async updateResponsibility(
    id: string,
    responsibility: ResponsibilityLabel,
  ): Promise<void> {
    try {
      await api.patch(`/tickets/${id}/responsibility`, { responsibility });
    } catch {
      console.warn("⚠️ Atualização simulada em modo offline.");
    }
  },

  async getPresignedUrl(
    ticketId: string,
    fileType: string,
  ): Promise<{ uploadUrl: string; publicUrl: string; objectKey: string }> {
    const response = await api.post("/media/presign", {
      ticketId,
      contentType: fileType,
    });
    return response.data;
  },

  async uploadFileToR2(
    file: File,
    ticketId: string,
  ): Promise<{ publicUrl: string; objectKey: string } | null> {
    try {
      const { uploadUrl, publicUrl, objectKey } = await this.getPresignedUrl(
        ticketId,
        file.type,
      );
      await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      return { publicUrl, objectKey };
    } catch {
      return null;
    }
  },

  async confirmMedia(params: {
    ticketId: string;
    objectKey: string;
    mediaType: MediaType;
    capturedAt: string;
    ticketPartId?: string;
    latitude?: number;
    longitude?: number;
  }): Promise<void> {
    await api.post("/media/confirm", params);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/tickets/${id}`);
  },

  async getAssemblers(): Promise<{ id: string; name: string }[]> {
    try {
      const response =
        await api.get<{ id: string; name: string; role: string }[]>(
          "/users/team",
        );
      return response.data.filter((m) => m.role === "ASSEMBLER");
    } catch {
      return [];
    }
  },

  async scheduleVisit(
    ticketId: string,
    assemblerId: string,
    scheduledAt: string,
  ): Promise<void> {
    await api.patch(`/tickets/${ticketId}/visit`, { assemblerId, scheduledAt });
  },

  async updateVisitStatus(
    ticketId: string,
    status: VisitStatus,
  ): Promise<void> {
    await api.patch(`/tickets/${ticketId}/visit/status`, { status });
  },

  async openClaim(
    ticketId: string,
    data: { carrierName: string; claimNumber: string; claimedValue?: number },
  ): Promise<TransportClaim> {
    const response = await api.patch<{
      message: string;
      claim: TransportClaim;
    }>(`/tickets/${ticketId}/claim`, data);
    return response.data.claim;
  },

  async updateClaimStatus(
    ticketId: string,
    status: ClaimStatus,
  ): Promise<TransportClaim> {
    const response = await api.patch<{
      message: string;
      claim: TransportClaim;
    }>(`/tickets/${ticketId}/claim/status`, { status });
    return response.data.claim;
  },

  async requestRma(
    ticketId: string,
    data: { responseDueAt?: string },
  ): Promise<FactoryRma> {
    const response = await api.patch<{ message: string; rma: FactoryRma }>(
      `/tickets/${ticketId}/rma`,
      data,
    );
    return response.data.rma;
  },

  async updateRmaStatus(
    ticketId: string,
    status: RmaStatus,
  ): Promise<FactoryRma> {
    const response = await api.patch<{ message: string; rma: FactoryRma }>(
      `/tickets/${ticketId}/rma/status`,
      { status },
    );
    return response.data.rma;
  },

  async getEmergencyStatus(ticketId: string): Promise<EmergencyStatusResponse> {
    const response = await api.get<EmergencyStatusResponse>(
      `/tickets/${ticketId}/emergency-status`,
    );
    return response.data;
  },

  async decideReverseLogistics(
    ticketId: string,
    decision: "REQUIRE_RETURN" | "AUTHORIZE_DISCARD",
  ): Promise<{
    id: string;
    reverseLogistics: ReverseLogisticsStatus;
    reverseLogisticsLabel: string | null;
  }> {
    const response = await api.patch<{
      message: string;
      ticket: {
        id: string;
        reverseLogistics: ReverseLogisticsStatus;
        reverseLogisticsLabel: string | null;
      };
    }>(`/tickets/${ticketId}/reverse-logistics`, { decision });
    return response.data.ticket;
  },

  async exportDossierPdf(ticketId: string): Promise<Blob> {
    const response = await api.get(`/tickets/${ticketId}/export/pdf`, {
      responseType: "blob",
    });
    return response.data;
  },

  async getTrash(): Promise<{ trash: TrashedTicket[]; retentionDays: number }> {
    const response = await api.get<{
      trash: TrashedTicket[];
      retentionDays: number;
    }>("/tickets/trash");
    return response.data;
  },

  async restore(id: string): Promise<Ticket> {
    const response = await api.patch<{ message: string; ticket: Ticket }>(
      `/tickets/${id}/restore`,
    );
    return response.data.ticket;
  },
};
