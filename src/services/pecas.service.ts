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

export const pecasService = {
  async getAll(): Promise<PecaAvariada[]> {
    try {
      const response = await api.get<{ parts: any[] }>(
        "/products/parts/reported",
      );

      // Garante que response.data.parts é um array antes de mapear
      const parts = response.data?.parts || [];

      return parts.map((item) => {
        // Trata as mídias com segurança absoluta para evitar undefined
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
          productName:
            item?.ticket?.product?.name || "Produto Não Identificado",
          qtdMidias: mediaUrls.length,
          openedBy:
            item?.ticket?.user?.name ||
            item?.ticket?.createdBy?.name ||
            "Usuário não identificado",
          assignedTechnician:
            item?.ticket?.assignedTo?.name ||
            item?.ticket?.technician?.name ||
            "Aguardando atribuição",
          mediaUrls,
        };
      });
    } catch (error) {
      console.error("🔴 Erro ao buscar peças do banco:", error);
      return [];
    }
  },
};
