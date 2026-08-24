import { api } from "../lib/api";
import type {
  LoginCredentials,
  LoginResponse,
  MeResponse,
} from "../types/auth.types";

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>("/auth/login", credentials);
    return response.data;
  },

  async me(): Promise<MeResponse> {
    const response = await api.get<MeResponse>("/auth/me");
    return response.data;
  },

  async logout(): Promise<void> {
    await api.post("/auth/logout");
  },
};
