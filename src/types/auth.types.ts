/**
 * FVF Check — Tipos de Autenticação
 * Espelham EXATAMENTE o payload devolvido pelos controllers reais
 * do backend (src/controllers/auth.controller.ts), incluindo a
 * hierarquia de papéis SUPER_ADMIN > ADMIN > ANALYST > ASSEMBLER.
 */

export type UserRole = "SUPER_ADMIN" | "ADMIN" | "ANALYST" | "ASSEMBLER";

export interface Tenant {
  id: string;
  name: string;
  document: string;
  planType: "LOJISTA" | "REDE" | "FABRICA";
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tenantId: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// Resposta exata de POST /auth/login
export interface LoginResponse {
  message: string;
  user: User;
}

// Resposta exata de GET /auth/me
export interface MeResponse {
  user: User & {
    active: boolean;
    tenant: Tenant;
  };
}
