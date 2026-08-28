import { api } from "../lib/api";

export type Periodo = "7d" | "30d" | "90d" | "12m";

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
}

export const reportsService = {
  async getAnalytics(periodo: Periodo): Promise<AnalyticsResponse> {
    const response = await api.get<AnalyticsResponse>("/analyst/analytics", {
      params: { periodo },
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
