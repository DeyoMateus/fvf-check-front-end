import { useState } from "react";
import {
  Mail,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { authService } from "../../services/auth.service";
import { Button } from "../ui/Button";

interface ForgotPasswordPageProps {
  onBackToLogin: () => void;
}

export function ForgotPasswordPage({ onBackToLogin }: ForgotPasswordPageProps) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      setSubmitting(true);
      await authService.forgotPassword(email);
      setSent(true);
    } catch {
      setError("Não foi possível processar a solicitação. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-abyss-950 p-4 text-steel-100">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-steel-700/60 bg-gradient-to-b from-abyss-800/80 to-abyss-900/90 p-8 shadow-2xl backdrop-blur-md">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-gold-500/30 bg-gold-500/10 text-gold-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight">
            Recuperar Senha
          </h1>
          <p className="text-xs text-steel-400">
            Informe seu e-mail corporativo. Enviaremos um link para redefinir
            sua senha.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {sent ? (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-300">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>
              Se o e-mail estiver cadastrado, você receberá as instruções em
              instantes.
            </span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel-500" />
              <input
                type="email"
                required
                placeholder="seu.email@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 w-full rounded-lg border border-steel-700/60 bg-abyss-900/60 pl-9 pr-3 text-sm text-steel-100 placeholder:text-steel-500 focus:border-gold-500/60 focus:outline-none focus:ring-2 focus:ring-gold-400/20"
              />
            </div>
            <Button
              type="submit"
              disabled={submitting}
              className="w-full justify-center"
            >
              {submitting ? "Enviando..." : "Enviar link de redefinição"}
            </Button>
          </form>
        )}

        <button
          onClick={onBackToLogin}
          className="flex w-full items-center justify-center gap-1.5 text-xs text-steel-400 hover:text-gold-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar para o login
        </button>
      </div>
    </div>
  );
}
