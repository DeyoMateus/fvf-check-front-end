import { api } from "../lib/api";

export interface PecaAvariada {
  id: string;
  partCode: string;
  quantity: number;
  defectType: "BROKEN" | "MISSING" | "HARDWARE_FAULT";
  emergencyNotes?: string;
  createdAt: string;
  ticketCode: string;
  ticketStatus: string;
  fabrica: string;
  danfe: string;
  productSku: string;
  productName: string;
  qtdMidias: number;
  openedBy: string;
  assignedTechnician: string;
  mediaUrls: string[];
}

export type PageLimit = 10 | 50 | 100;

export interface PecasPageResult {
  items: PecaAvariada[];
  page: number;
  limit: PageLimit;
  total: number;
  hasMore: boolean;
}

export interface PecasAnalytics {
  totalRegistros: number;
  totalItens: number;
  factoryCases: number;
  transportCases: number;
  assemblyCases: number;
  topFabricaName: string;
  topFabricaCount: number;
  topAssemblerName: string;
  topAssemblerTotal: number;
  topAssemblerErrors: number;
  assemblerRanking: { tech: string; errorCount: number }[];
}

function mapItem(item: any): PecaAvariada {
  const rawMedia = item?.media || item?.ticket?.media || [];
  const mediaUrls = Array.isArray(rawMedia)
    ? rawMedia.map((m: any) => m?.url || m?.path).filter(Boolean)
    : [];

  return {
    id: item?.id || Math.random().toString(),
    partCode: item?.partCode || "CÓD-INDISPONÍVEL",
    quantity: item?.quantity || 1,
    defectType: item?.defectType || "BROKEN",
    emergencyNotes: item?.emergencyNotes || "Sem observações",
    createdAt: item?.createdAt || new Date().toISOString(),
    ticketCode: item?.ticket?.code || "S/N",
    ticketStatus: item?.ticket?.status || "OPEN",
    fabrica: item?.ticket?.tenant?.name || "Fábrica Geral",
    danfe: item?.ticket?.invoice?.number || "N/A",
    productSku: item?.ticket?.product?.sku || "SKU-PADRAO",
    productName: item?.ticket?.product?.name || "Produto Não Identificado",
    qtdMidias: mediaUrls.length,
    openedBy: item?.ticket?.createdBy?.name || "Usuário não identificado",
    assignedTechnician:
      item?.ticket?.assignedTo?.name || "Aguardando atribuição",
    mediaUrls,
  };
}

export const pecasService = {
  async getPage(params: {
    page: number;
    limit: PageLimit;
    startDate?: string;
    endDate?: string;
  }): Promise<PecasPageResult> {
    const response = await api.get<{
      parts: any[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        hasMore: boolean;
      };
    }>("/products/parts/reported", { params });

    return {
      items: (response.data.parts || []).map(mapItem),
      page: response.data.pagination.page,
      limit: response.data.pagination.limit as PageLimit,
      total: response.data.pagination.total,
      hasMore: response.data.pagination.hasMore,
    };
  },

  async exportCsv(params: {
    startDate?: string;
    endDate?: string;
  }): Promise<Blob> {
    const response = await api.get("/products/parts/reported/export", {
      params,
      responseType: "blob",
    });
    return response.data;
  },
  async getAnalytics(params: {
    startDate?: string;
    endDate?: string;
  }): Promise<PecasAnalytics> {
    const response = await api.get<PecasAnalytics>(
      "/products/parts/analytics",
      { params },
    );
    return response.data;
  },
};
