import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, Zap } from "lucide-react";
import {
  ticketsService,
  EMERGENCY_MEDIA_LABELS,
  type EmergencyStatusResponse,
} from "../../services/tickets.service";

interface EmergencyStatusBannerProps {
  ticketId: string;
  isEmergencyMode?: boolean;
}

export function EmergencyStatusBanner({
  ticketId,
  isEmergencyMode,
}: EmergencyStatusBannerProps) {
  const [status, setStatus] = useState<EmergencyStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isEmergencyMode) return;
    let cancelled = false;

    setLoading(true);
    ticketsService
      .getEmergencyStatus(ticketId)
      .then((data) => {
        if (!cancelled) setStatus(data);
      })
      .catch(() => {
        if (!cancelled) setStatus(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [ticketId, isEmergencyMode]);

  if (!isEmergencyMode) return null;

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-300">
        <Zap className="h-4 w-4" />
        Modo de Emergência
      </div>

      {loading && (
        <p className="mt-2 flex items-center gap-2 text-xs text-steel-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Verificando evidências obrigatórias...
        </p>
      )}

      {!loading && status?.satisfied && (
        <p className="mt-2 flex items-center gap-2 text-xs text-emerald-300">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Todas as evidências obrigatórias foram anexadas.
        </p>
      )}

      {!loading && status && !status.satisfied && (
        <div className="mt-2 space-y-1.5">
          <p className="flex items-center gap-2 text-xs text-red-300">
            <AlertTriangle className="h-3.5 w-3.5" />
            Faltam {status.missing.length} evidência(s) obrigatória(s):
          </p>
          <ul className="ml-5 list-disc text-[11px] text-steel-300">
            {status.missing.map((type) => (
              <li key={type}>{EMERGENCY_MEDIA_LABELS[type]}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}