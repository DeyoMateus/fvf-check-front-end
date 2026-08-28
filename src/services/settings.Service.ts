import { api } from "../lib/api"; // ou fetch nativo

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

export const settingsService = {
  async getSettings(): Promise<SettingsDTO> {
    const response = await api.get("/settings");
    return response.data;
  },

  async updateSettings(data: SettingsDTO): Promise<SettingsDTO> {
    const response = await api.put("/settings", data);
    return response.data;
  },
};
