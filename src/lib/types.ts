/* ============================================================
   FONTE ÚNICA DE TIPOS DE TICKET
   Espelha os enums do schema.prisma. Qualquer campo novo no
   backend deve ser adicionado AQUI PRIMEIRO — services/tickets.service.ts
   apenas re-exporta este arquivo, não deve mais declarar tipos.
   ============================================================ */

/* ---------- ENUMS ---------- */

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

// Alinhado 100% ao enum MediaType do schema.prisma (inclui AUDIO)
export type MediaType =
  | "AMBIENT"
  | "DEFECT"
  | "MANUAL_PAGE"
  | "LABEL"
  | "DISCARD_PROOF"
  | "AUDIO";

export type VisitStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

export type ClaimStatus = "OPEN" | "UNDER_REVIEW" | "APPROVED" | "DENIED";

export type RmaStatus = "REQUESTED" | "IN_PROGRESS" | "APPROVED" | "DENIED";

// Alinhado ao enum RevLogistics do schema.prisma
export type ReverseLogisticsStatus = "NONE" | "REQUIRED" | "DISCARDED";

/* ---------- DTOs (payloads de criação) ---------- */

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

// Payload real enviado para POST /tickets (o que o Zod createTicketSchema espera)
export interface CreateTicketPayload {
  isEmergencyMode?: boolean;
  packageCondition: PkgCondition;
  suggestedResponsibility?: ResponsibilityLabel;
  invoice: {
    nfeKey: string;
    number: string;
    series: string;
    issuedAt: string;
    customer: {
      name: string;
      phone?: string;
    };
    productName?: string;
    batchNumber?: string;
  };
  parts: Array<{
    partCode: string;
    quantity: number;
    defectType: DefectType;
    emergencyNotes?: string;
  }>;
  mediaFiles?: Array<{
    url: string;
    type: MediaType;
    latitude?: number;
    longitude?: number;
    capturedAt: string;
  }>;
}

/* ---------- ENTIDADES DE DOMÍNIO ---------- */

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

export interface TechnicalVisit {
  id: string;
  ticketId?: string;
  assemblerId: string;
  assemblerName?: string;
  scheduledAt: string;
  status: VisitStatus;
  assembler?: {
    id: string;
    name: string;
    email?: string;
  };
}

export interface TransportClaim {
  id: string;
  ticketId: string;
  carrierName: string;
  claimNumber: string;
  claimedValue?: number | null;
  status: ClaimStatus;
  createdAt: string;
  updatedAt: string;
}

export interface FactoryRma {
  id: string;
  ticketId: string;
  rmaNumber: string;
  status: RmaStatus;
  responseDueAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TicketEvent {
  id: string;
  ticketId: string;
  type: string;
  message: string;
  actorId?: string | null;
  actor?: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
}

export interface CommentItem {
  id: string;
  text: string;
  authorId?: string;
  authorName?: string;
  createdAt: string;
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
  isEmergencyMode?: boolean;
  reverseLogistics?: ReverseLogisticsStatus;
  reverseLogisticsLabel?: string | null;

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

  technicalVisit?: TechnicalVisit | null;
  transportClaim?: TransportClaim | null;
  factoryRma?: FactoryRma | null;
  events?: TicketEvent[];
  comments?: CommentItem[];

  createdAt?: string;
  updatedAt?: string;
  dueDate?: string;
  slaHours?: number;
  assignedUser?: string;
}

/* ---------- DICIONÁRIOS DE EXIBIÇÃO (UI LABELS) ---------- */

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

export const VISIT_STATUS_LABELS: Record<VisitStatus, string> = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmada",
  COMPLETED: "Concluída",
  CANCELLED: "Cancelada",
};

export const CLAIM_STATUS_LABELS: Record<ClaimStatus, string> = {
  OPEN: "Aberto",
  UNDER_REVIEW: "Em Análise",
  APPROVED: "Aprovado",
  DENIED: "Negado",
};

export const RMA_STATUS_LABELS: Record<RmaStatus, string> = {
  REQUESTED: "Solicitado",
  IN_PROGRESS: "Em Andamento",
  APPROVED: "Aprovado",
  DENIED: "Negado",
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
