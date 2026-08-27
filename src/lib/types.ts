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

// Ajuste em DefectType (Alinhado 100% com o Prisma)
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

/* ============================================================
   3. ESTRUTURA DE DADOS & INTERFACES (Entidades do Domínio)
   ============================================================ */

export interface Media {
  id: string;
  ticketId: string;
  ticketPartId?: string | null;
  url: string;
  type: MediaType;
  latitude?: number | null;
  longitude?: number | null;
  capturedAt: string;
  createdAt: string;
}

export interface TicketPart {
  id: string;
  ticketId: string;
  partCode: string;
  quantity: number;
  defectType: DefectType;
  emergencyNotes?: string;
  createdAt: string;
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
  severity?: Severity;

  // Relações e metadados retornados pelo Backend
  customerName?: string;
  cityName?: string;
  nfeKey?: string;
  batchNumber?: string;

  scores?: {
    transporte: number;
    fabrica: number;
    montagem: number;
  };
  parts?: TicketPart[];

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
];
