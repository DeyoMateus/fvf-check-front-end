import axios from "axios";

/**
 * Cliente HTTP unificado (Axios) para conectar o PWA ao Backend do FVF Check.
 * `withCredentials: true` é OBRIGATÓRIO para envio/recebimento dos cookies JWT HTTP-only.
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3333/api/v1",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor de Resposta: Trata sessões expiradas de forma transparente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Se a API retornar 401 (Não Autorizado) e o usuário não estiver na tela de login
    if (
      error.response?.status === 401 &&
      window.location.pathname !== "/login"
    ) {
      console.warn(
        "⚠️ Sessão expirada ou inválida. Redirecionando para o login...",
      );
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);
