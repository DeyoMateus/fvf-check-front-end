import { Camera, FileText, MapPin, User } from "lucide-react";
import type { Ticket } from "../../lib/types";
import { ResponsibilityBadge } from "./ResponsibilityBadge";
import { SeverityBadge } from "./SeverityBadge";
import { SlaIndicator } from "./SlaIndicator";
import { TriageScoreMeter } from "./TriageScoreMeter";
import { cn } from "../../utils/cn";

interface TicketCardProps {
  ticket: Ticket;
  onClick?: () => void;
  compact?: boolean;
}

/**
 * Card de Ticket reutilizável (Kanban + Tabela mobile).
 * - Foco no Triage Score (responsabilidade)
 * - Resumo do cliente, lote e Danfe
 * - SLA + severidade em destaque
 */
export function TicketCard({ ticket, onClick, compact }: TicketCardProps) {
  const totalEvidencias = ticket.pecas.reduce((a, p) => a + p.evidencia, 0);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group w-full text-left rounded-xl border border-steel-700/60 bg-gradient-to-b from-abyss-800/85 to-abyss-900/85",
        "p-4 transition-all hover:border-gold-500/50 hover:from-abyss-800 hover:to-abyss-800",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/60",
        "shadow-[0_4px_20px_-10px_rgba(0,0,0,0.6)]",
      )}
    >
      {/* HEADER: ID + SLA */}
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] font-bold tracking-wider text-gold-400">
          {ticket.id}
        </span>
        <SlaIndicator hours={ticket.slaHoras} />
      </div>

      {/* CLIENTE + CIDADE */}
      <div className="mt-3 space-y-1">
        <h4 className="line-clamp-2 text-sm font-semibold leading-snug text-steel-50">
          {ticket.cliente}
        </h4>
        <div className="flex items-center gap-1.5 text-[11px] text-steel-400">
          <MapPin className="h-3 w-3" />
          <span>{ticket.cidade}</span>
        </div>
      </div>

      {/* TRIAGE SCORE */}
      <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-steel-700/40 bg-abyss-950/40 p-2.5">
        <TriageScoreMeter scores={ticket.scores} size="sm" showLegend={false} />
        <div className="flex-1">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-steel-400">
            Hipótese dominante
          </p>
          <div className="mt-1.5">
            <ResponsibilityBadge value={ticket.responsabilidade} />
          </div>
        </div>
      </div>

      {/* BADGES */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <SeverityBadge value={ticket.severidade} />
        {ticket.responsavel && (
          <span className="inline-flex items-center gap-1 rounded-md border border-steel-700/50 bg-abyss-900/40 px-1.5 py-0.5 text-[10px] text-steel-300">
            <User className="h-3 w-3" />
            <span className="max-w-[110px] truncate">{ticket.responsavel}</span>
          </span>
        )}
      </div>

      {/* FOOTER */}
      {!compact && (
        <div className="mt-3 flex items-center justify-between border-t border-steel-700/40 pt-3 text-[11px] text-steel-400">
          <div className="flex items-center gap-1.5">
            <Camera className="h-3 w-3" />
            <span className="tabular-nums">
              {totalEvidencias} evidência{totalEvidencias !== 1 && "s"}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <FileText className="h-3 w-3" />
            <span className="font-mono">{ticket.danfe}</span>
            <span className="text-steel-600">•</span>
            <span className="font-mono">{ticket.lote}</span>
          </div>
        </div>
      )}
    </button>
  );
}
