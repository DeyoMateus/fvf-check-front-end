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
  refreshUser: () => Promise<void>; // 👈 Novo método adicionado
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function refreshUser() {
    try {
      const data = await authService.me();
      setUser(data.user);
    } catch {
      setUser(null);
    }
  }

  useEffect(() => {
    async function checkAuth() {
      try {
        await refreshUser();
      } finally {
        setIsLoading(false);
      }
    }
    checkAuth();
  }, []);

  async function login(credentials: LoginCredentials) {
    await authService.login(credentials);
    await refreshUser();
  }

  async function logout() {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshUser, 
      }}
    >
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