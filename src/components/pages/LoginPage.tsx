import React, { useState } from "react";
import { KeyRound, Mail, LogIn, AlertCircle, ShieldCheck } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../ui/Button";

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  setError(null);

  if (!email || !password) {
    setError("Preencha todos os campos para continuar.");
    return;
  }

  try {
    setSubmitting(true);
    // ✅ Agora enviamos 'password' que condiz com o Zod do Fastify
    await login({ email: email.trim(), password });
  } catch (err: unknown) {
    console.error(err);
    setError("Credenciais inválidas. Verifique seu e-mail e senha.");
  } finally {
    setSubmitting(false);
  }
}

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-abyss-950 p-4 text-steel-100">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-steel-700/60 bg-gradient-to-b from-abyss-800/80 to-abyss-900/90 p-8 shadow-2xl backdrop-blur-md">
        {/* Header do Card */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-gold-500/30 bg-gold-500/10 text-gold-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gold-400">
            FVF CHECK • Sistema
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Acessar <span className="text-gold-gradient">Plataforma</span>
          </h1>
          <p className="text-xs text-steel-400">
            Entre com suas credenciais corporativas para acessar o painel.
          </p>
        </div>

        {/* Mensagem de Erro */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Formulário de Login */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-steel-400">
              E-mail Corporativo
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-steel-500">
                <Mail className="h-4 w-4" />
              </div>
              <input
                type="email"
                required
                placeholder="seu.email@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 w-full rounded-lg border border-steel-700/60 bg-abyss-900/60 pl-9 pr-3 text-sm text-steel-100 placeholder:text-steel-500 focus:border-gold-500/60 focus:outline-none focus:ring-2 focus:ring-gold-400/20"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-steel-400">
              Senha de Acesso
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-steel-500">
                <KeyRound className="h-4 w-4" />
              </div>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 w-full rounded-lg border border-steel-700/60 bg-abyss-900/60 pl-9 pr-3 text-sm text-steel-100 placeholder:text-steel-500 focus:border-gold-500/60 focus:outline-none focus:ring-2 focus:ring-gold-400/20"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full justify-center mt-2"
          >
            {submitting ? (
              "Autenticando..."
            ) : (
              <>
                <LogIn className="h-4 w-4 mr-2" /> Entrar no Sistema
              </>
            )}
          </Button>
        </form>

        {/* Footer Informativo */}
        <div className="border-t border-steel-700/40 pt-4 text-center text-[11px] text-steel-500">
          FVF Check Protocol • Multi-Tenant Enterprise Security
        </div>
      </div>
    </div>
  );
}