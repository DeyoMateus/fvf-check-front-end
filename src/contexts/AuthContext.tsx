import React, { createContext, useContext, useEffect, useState } from "react";
import { authService } from "../services/auth.service";
import type { LoginCredentials, MeResponse } from "../types/auth.types";

type SessionUser = MeResponse["user"];

interface AuthContextType {
  user: SessionUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Ao carregar a página, checa se o cookie HttpOnly ainda é válido
  // chamando /auth/me — não guardamos token nenhum no front.
  useEffect(() => {
    async function checkAuth() {
      try {
        const data = await authService.me();
        setUser(data.user);
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    checkAuth();
  }, []);

  async function login(credentials: LoginCredentials) {
    const data = await authService.login(credentials);
    // Login não devolve "active"/"tenant" completo — busca o perfil
    // completo em seguida pra manter o estado consistente com /auth/me.
    const me = await authService.me();
    setUser(me.user);
    void data;
  }

  async function logout() {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser utilizado dentro de um AuthProvider");
  }
  return context;
}
