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
}

export const pecasService = {
  async getAll(): Promise<PecaAvariada[]> {
    try {
      const response = await api.get<{ parts: any[] }>(
        "/products/parts/reported",
      );

      return response.data.parts.map((item) => ({
        id: item.id,
        partCode: item.partCode || "CÓD-INDISPONÍVEL",
        quantity: item.quantity || 1,
        defectType: item.defectType,
        emergencyNotes: item.emergencyNotes || "Sem observações",
        createdAt: item.createdAt,
        ticketCode: item.ticket?.code || "S/N",
        ticketStatus: item.ticket?.status || "OPEN",
        fabrica: item.ticket?.tenant?.name || "Fábrica Geral",
        danfe: item.ticket?.invoice?.number || "N/A",
        productSku: item.ticket?.product?.sku || "SKU-PADRAO",
        productName: item.ticket?.product?.name || "Produto Não Identificado",
        qtdMidias: item.media?.length || 0,
      }));
    } catch (error) {
      console.error("🔴 Erro ao buscar peças do banco:", error);
      return [];
    }
  },
};
