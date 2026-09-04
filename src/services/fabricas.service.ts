import { api } from "../lib/api";

export interface Fabrica {
  id: string;
  nome: string;
  cnpj: string;
  cidade: string;
  uf: string;
  especialidade: string;
  status: "ATIVA" | "EM_AUDITORIA" | "SUSPENSA";
  slaMedioHoras: number;
  slaMetaHoras: number;
  rmaAbertos: number;
  taxaDefeito: number;
  lotesAtivos: number;
  contactEmail: string;
  scoreQualidade: number;
  webhookUrl?: string;
  parentId?: string;
  rmaEstourados?: number;
}

export interface CreateFabricaInput {
  name: string;
  document: string;
  planType?: "FABRICA" | "REDE" | "LOJISTA";
  city?: string;
  state?: string;
  webhookUrl?: string;
  parentId?: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  slaMetaHoras?: number;
}

export interface UpdateFabricaInput {
  name?: string;
  document?: string;
  city?: string;
  state?: string;
  slaMetaHoras?: number;
  webhookUrl?: string | null;
  parentId?: string | null;
  planType?: "FABRICA" | "REDE" | "LOJISTA";
  contactEmail?: string;
}

function mapBackendFabricaToUI(item: any): Fabrica {
  return {
    id: item.id,
    nome: item.name || "Fábrica Sem Nome",
    cnpj: item.document || "00.000.000/0001-00",
    cidade: item.cidade || item.city || "Não informada",
    uf: item.uf || item.state || "UF",
    contactEmail:
      item.contactEmail ||
      item.users?.[0]?.email ||
      item.email ||
      "contato@fabrica.com",
    especialidade: item.especialidade || item.planType || "Geral",
    status: item.status || (item.active === false ? "SUSPENSA" : "ATIVA"),
    slaMedioHoras: item.slaMedioHoras ?? 24,
    slaMetaHoras: item.slaMetaHoras ?? 24,
    rmaAbertos: item.rmaAbertos ?? item._count?.tickets ?? 0,
    taxaDefeito: item.taxaDefeito ?? 0,
    lotesAtivos: item.lotesAtivos ?? item._count?.products ?? 0,
    scoreQualidade: item.scoreQualidade ?? 100,
    webhookUrl: item.webhookUrl || undefined,
    parentId: item.parentId || undefined,
    rmaEstourados: item.rmaEstourados ?? 0,
  };
}

export const fabricasService = {
  async getAll(): Promise<Fabrica[]> {
    try {
      const response = await api.get<any[]>("/fabricas");
      return response.data.map(mapBackendFabricaToUI);
    } catch (error) {
      console.error("Erro ao carregar fábricas do banco de dados:", error);
      return [];
    }
  },

  async getById(id: string): Promise<Fabrica | undefined> {
    try {
      const response = await api.get<any>(`/fabricas/${id}`);
      return mapBackendFabricaToUI(response.data);
    } catch (error) {
      console.error(`Erro ao carregar fábrica ${id}:`, error);
      return undefined;
    }
  },

  async create(data: CreateFabricaInput): Promise<Fabrica> {
    const response = await api.post("/management/tenants", {
      planType: data.planType || "FABRICA",
      ...data,
    });
    return mapBackendFabricaToUI(response.data.tenant || response.data);
  },

  async update(id: string, data: UpdateFabricaInput): Promise<Fabrica> {
    const response = await api.put(`/fabricas/${id}`, data);
    return mapBackendFabricaToUI(response.data.fabrica || response.data);
  },

  async toggleStatus(id: string, active: boolean): Promise<void> {
    await api.patch(`/fabricas/${id}/status`, { active });
  },

  async updateStatus(
    id: string,
    statusOrActive: boolean | "ATIVA" | "SUSPENSA",
  ): Promise<void> {
    const active =
      typeof statusOrActive === "boolean"
        ? statusOrActive
        : statusOrActive !== "SUSPENSA";
    await api.patch(`/fabricas/${id}/status`, { active });
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/fabricas/${id}`);
  },
};
