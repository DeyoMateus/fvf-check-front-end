// Domínio FVF Check — nomenclatura real do setor moveleiro
// (MDF, fita de borda, lote, NF-e, Danfe, etc.)

export type Responsabilidade = "TRANSPORTE" | "FABRICA" | "MONTAGEM";

export type StatusTicket =
  | "ABERTO" // acabou de chegar
  | "TRIAGEM" // analista avaliando
  | "EM_ANALISE" // aguardando fornecedor/fábrica
  | "RESOLVIDO" // solucionado
  | "CANCELADO";

export type Severidade = "BAIXA" | "MEDIA" | "ALTA" | "CRITICA";

export interface PecaAveriada {
  id: string;
  descricao: string; // ex: "Lateral direita 600x2200mm"
  material: string; // ex: "MDF Ultra 15mm - Carvalho Hanover"
  evidencia: number; // qtd de fotos
  score: number; // 0-100 (probabilidade de defeito real)
}

export interface Ticket {
  id: string; // FVF-2025-0142
  cliente: string;
  cidade: string;
  danfe: string; // NF-e referência
  lote: string; // lote da fábrica
  status: StatusTicket;
  responsabilidade: Responsabilidade;
  severidade: Severidade;
  // Triage scores — soma 100%
  scores: { transporte: number; fabrica: number; montagem: number };
  pecas: PecaAveriada[];
  abertoEm: string; // ISO
  slaHoras: number; // horas restantes
  responsavel?: string;
}

export const RESP_LABELS: Record<Responsabilidade, string> = {
  TRANSPORTE: "Avaria no Transporte",
  FABRICA: "Defeito de Fábrica",
  MONTAGEM: "Erro de Montagem",
};

export const STATUS_LABELS: Record<StatusTicket, string> = {
  ABERTO: "Aberto",
  TRIAGEM: "Em Triagem",
  EM_ANALISE: "Em Análise",
  RESOLVIDO: "Resolvido",
  CANCELADO: "Cancelado",
};

export const STATUS_ORDER: StatusTicket[] = [
  "ABERTO",
  "TRIAGEM",
  "EM_ANALISE",
  "RESOLVIDO",
];
