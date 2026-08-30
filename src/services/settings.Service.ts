import { api } from "../lib/api";

export interface SettingsDTO {
  nome?: string;
  email?: string;
  cargo?: string;
  empresa?: string;
  cnpj?: string;
  timezone?: string;
  notifications?: Record<string, boolean>;
  integrations?: Record<string, boolean>;
  security?: Record<string, boolean>;
}

export interface UpdateSettingsPayload {
  nome?: string;
  email?: string;
  empresa?: string;
  cnpj?: string;
  timezone?: string;
  notifications?: Record<string, boolean>;
  integrations?: Record<string, boolean>;
  security?: Record<string, boolean>;
}

export const settingsService = {
  async getSettings(): Promise<SettingsDTO> {
    const response = await api.get<SettingsDTO>("/settings");
    return response.data;
  },

  async updateSettings(data: UpdateSettingsPayload) {
    const response = await api.put<{ message: string }>("/settings", data);
    return response.data;
  },
};
