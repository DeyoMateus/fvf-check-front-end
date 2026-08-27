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
 * - Resumo do cliente, lote e Danfe/NF-e
 * - SLA + severidade em destaque
 */
export function TicketCard({ ticket, onClick, compact }: TicketCardProps) {
  // Quantidade de peças afetadas / evidências reportadas
  const totalEvidencias = ticket.parts?.length ?? 0;

  // Fallbacks visuais para dados nulos ou vazios
  const displayCode = ticket.code || ticket.id;
  const displayCustomer = ticket.customerName || "Cliente não informado";
  const displayCity = ticket.cityName || "Não especificada";
  const displayNfe = ticket.nfeKey ? `NF-e ${ticket.nfeKey.slice(0, 8)}...` : "Sem NF-e";
  const displayBatch = ticket.batchNumber ? `Lote ${ticket.batchNumber}` : "Sem lote";

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
      {/* HEADER: ID/CÓDIGO + SLA */}
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] font-bold tracking-wider text-gold-400">
          {displayCode}
        </span>
        <SlaIndicator hours={ticket.slaHours ?? 24} />
      </div>

      {/* CLIENTE + CIDADE */}
      <div className="mt-3 space-y-1">
        <h4 className="line-clamp-2 text-sm font-semibold leading-snug text-steel-50">
          {displayCustomer}
        </h4>
        <div className="flex items-center gap-1.5 text-[11px] text-steel-400">
          <MapPin className="h-3 w-3" />
          <span>{displayCity}</span>
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
            <ResponsibilityBadge value={ticket.suggestedResponsibility ?? "TRANSPORT_DAMAGE"} />
          </div>
        </div>
      </div>

      {/* BADGES */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <SeverityBadge value={ticket.severity ?? "MEDIUM"} />
        {ticket.assignedUser && (
          <span className="inline-flex items-center gap-1 rounded-md border border-steel-700/50 bg-abyss-900/40 px-1.5 py-0.5 text-[10px] text-steel-300">
            <User className="h-3 w-3" />
            <span className="max-w-[110px] truncate">{ticket.assignedUser}</span>
          </span>
        )}
      </div>

      {/* FOOTER */}
      {!compact && (
        <div className="mt-3 flex items-center justify-between border-t border-steel-700/40 pt-3 text-[11px] text-steel-400">
          <div className="flex items-center gap-1.5">
            <Camera className="h-3 w-3" />
            <span className="tabular-nums">
              {totalEvidencias} peça{totalEvidencias !== 1 && "s"}/item
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <FileText className="h-3 w-3" />
            <span className="font-mono">{displayNfe}</span>
            <span className="text-steel-600">•</span>
            <span className="font-mono">{displayBatch}</span>
          </div>
        </div>
      )}
    </button>
  );
}