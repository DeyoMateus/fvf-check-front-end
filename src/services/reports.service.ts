import { api } from "../lib/api";

export type Periodo = "7d" | "30d" | "90d" | "12m" | "custom";

export interface AnalyticsResponse {
  kpis: Array<{
    label: string;
    valor: string;
    delta: string;
    positivo: boolean;
  }>;
  distribuicao: Array<{
    mes: string;
    transporte: number;
    fabrica: number;
    montagem: number;
  }>;
  topDefeitos: Array<{
    nome: string;
    cat: "TRANSPORTE" | "FABRICA" | "MONTAGEM";
    qtd: number;
  }>;
  insights: {
    slaMedioHoras: number;
    alertaProducao: string;
  };
}

export const reportsService = {
  async getAnalytics(
    periodo: Periodo,
    startDate?: string,
    endDate?: string,
  ): Promise<AnalyticsResponse> {
    const response = await api.get<AnalyticsResponse>("/analyst/analytics", {
      params: {
        periodo,
        ...(periodo === "custom" && startDate ? { startDate } : {}),
        ...(periodo === "custom" && endDate ? { endDate } : {}),
      },
    });
    return response.data;
  },

  async downloadFile(endpoint: string): Promise<Blob> {
    const response = await api.get(endpoint, {
      responseType: "blob",
    });
    return response.data;
  },
};
