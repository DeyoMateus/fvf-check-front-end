import { api } from "../lib/api";
import { TICKETS_MOCK } from "../lib/mockData";

/* ============================================================
   1. ENUMS & TIPOS PRINCIPAIS (Alinhados 100% com o Prisma)
   ============================================================ */

export type ResponsibilityLabel =
  | "TRANSPORT_DAMAGE"
  | "FACTORY_DEFECT"
  | "ASSEMBLY_ERROR";

export type TicketStatus =
  | "OPEN"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "COMPLETED"
  | "CANCELLED";

export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type PkgCondition = "INTACT" | "DAMAGED";

export type DefectType = "BROKEN" | "MISSING" | "HARDWARE_FAULT";

export type MediaType =
  | "AMBIENT"
  | "DEFECT"
  | "MANUAL_PAGE"
  | "LABEL"
  | "DISCARD_PROOF";

/* ============================================================
   2. DTOs (Data Transfer Objects)
   ============================================================ */

export interface TicketInvoiceDTO {
  number: string;
  nfeKey: string;
  customerName: string;
  customerPhone?: string;
  productName: string;
  batchNumber?: string;
}

export interface TicketPartInputDTO {
  partCode: string;
  description: string;
  quantity: number;
  damageType:
    | "PECA_QUEBRADA"
    | "FALTOU_PECA"
    | "FERRAGEM_DEFEITUOSA"
    | "EMBALAGEM_AVARIADA";
}

export interface CreateTicketDTO {
  isEmergencyMode: boolean;
  invoice: TicketInvoiceDTO;
  packageCondition: PkgCondition;
  suggestedResponsibility: ResponsibilityLabel;
  description: string;
  parts: TicketPartInputDTO[];
}

export interface CreateTicketPayload {
  isEmergencyMode?: boolean;
  packageCondition: "INTACT" | "DAMAGED";
  suggestedResponsibility?:
    | "TRANSPORT_DAMAGE"
    | "FACTORY_DEFECT"
    | "ASSEMBLY_ERROR";
  invoice: {
    nfeKey: string;
    number: string;
    series: string;
    issuedAt: string;
    customer: {
      name: string;
      phone?: string;
    };
    productName?: string; // <--- Adicione esta linha
    batchNumber?: string; // <--- Adicione esta linha
  };
  parts: Array<{
    partCode: string;
    quantity: number;
    defectType: "BROKEN" | "MISSING" | "HARDWARE_FAULT";
    emergencyNotes?: string;
  }>;
  mediaFiles?: Array<{
    url: string;
    type: "AMBIENT" | "DEFECT" | "LABEL" | "AUDIO";
    latitude?: number;
    longitude?: number;
    capturedAt: string;
  }>;
}

/* ============================================================
   3. ESTRUTURA DE DADOS & INTERFACES (Entidades do Domínio)
   ============================================================ */

export interface Media {
  id?: string;
  ticketId?: string;
  ticketPartId?: string | null;
  url: string;
  type: MediaType | string;
  latitude?: number | null;
  longitude?: number | null;
  capturedAt?: string;
  createdAt?: string;
}

export interface TicketPart {
  id: string;
  ticketId?: string;
  partCode: string;
  quantity: number;
  defectType: DefectType;
  emergencyNotes?: string;
  createdAt?: string;
  media?: Media[];
}

export interface Ticket {
  id: string;
  code?: string;
  tenantId?: string;
  invoiceId?: string;
  productId?: string;
  createdById?: string;
  description?: string;

  status: TicketStatus;
  suggestedResponsibility?: ResponsibilityLabel;
  packageCondition?: PkgCondition;
  severity?: Severity;

  // Relações e metadados retornados pelo Backend
  customerName?: string;
  customerPhone?: string;
  cityName?: string;
  nfeKey?: string;
  batchNumber?: string;

  scores?: {
    transporte: number;
    fabrica: number;
    montagem: number;
  };
  parts?: TicketPart[];
  mediaFiles?: Media[];

  createdAt?: string;
  updatedAt?: string;
  slaHours?: number;
  assignedUser?: string;
}

/* ============================================================
   4. DICIONÁRIOS DE EXIBIÇÃO (UI LABELS)
   ============================================================ */

export const RESPONSIBILITY_LABELS: Record<ResponsibilityLabel, string> = {
  TRANSPORT_DAMAGE: "Avaria no Transporte",
  FACTORY_DEFECT: "Defeito de Fábrica",
  ASSEMBLY_ERROR: "Erro de Montagem",
};

export const STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: "Aberto",
  UNDER_REVIEW: "Em Análise",
  APPROVED: "Aprovado",
  REJECTED: "Rejeitado",
  COMPLETED: "Resolvido",
  CANCELLED: "Cancelado",
};

export const SEVERITY_LABELS: Record<Severity, string> = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
  CRITICAL: "Crítica",
};

export const STATUS_ORDER: TicketStatus[] = [
  "OPEN",
  "UNDER_REVIEW",
  "APPROVED",
  "COMPLETED",
  "CANCELLED",
];

/* ============================================================
   5. TICKETS SERVICE
   ============================================================ */

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
        suggestedResponsibility: item.suggestedResponsibility ?? undefined,
        severity: item.severity ?? "MEDIUM",
        customerName: item.createdBy?.name ?? item.invoice?.customer?.name,
        customerPhone: item.invoice?.customer?.phone,
        cityName: item.invoice?.customer?.address?.city,
        nfeKey: item.invoice?.nfeKey,
        batchNumber: item.invoice?.batchNumber,
        packageCondition: item.packageCondition,
        parts: item.parts ?? [],
        mediaFiles: item.mediaFiles ?? [],
        scores: item.scores,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        slaHours: item.slaHours ?? 24,
        assignedUser: item.assignedTo?.name,
      }));
    } catch {
      console.warn(
        "⚠️ Rota /tickets com erro no Backend. Utilizando MOCK temporário.",
      );
      return TICKETS_MOCK as unknown as Ticket[];
    }
  },

  async create(data: CreateTicketPayload): Promise<Ticket> {
    try {
      const response = await api.post<{ message: string; ticket: Ticket }>(
        "/tickets",
        data,
      );
      // Lê corretamente a propriedade 'ticket' retornada pela API do backend
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
      } as Ticket;
    } catch (error) {
      console.warn(
        "⚠️ Falha ao conectar ao servidor. Simulado envio local do chamado.",
        error,
      );

      return {
        id: `ticket-${Date.now()}`,
        code: `FVF-${Math.floor(100000 + Math.random() * 900000)}`,
        status: "OPEN",
        suggestedResponsibility: data.suggestedResponsibility ?? undefined,
        customerName: data.invoice.customer.name,
        customerPhone: data.invoice.customer.phone,
        packageCondition: data.packageCondition,
        batchNumber: "LT-LOCAL",
        description: data.parts[0]?.emergencyNotes ?? "",
        severity: "MEDIUM",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
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
    fileName: string,
    fileType: string,
  ): Promise<{ uploadUrl: string; publicUrl: string }> {
    const response = await api.post("/media/presign", { fileName, fileType });
    return response.data;
  },

  async uploadFileToR2(file: File): Promise<string> {
    try {
      const { uploadUrl, publicUrl } = await this.getPresignedUrl(
        file.name,
        file.type,
      );
      await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      return publicUrl;
    } catch {
      return URL.createObjectURL(file);
    }
  },
};
