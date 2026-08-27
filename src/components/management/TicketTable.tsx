import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ExternalLink } from "lucide-react";
import { TriageScoreMeter } from "../domain/TriageScoreMeter";
import { ResponsibilityBadge } from "../domain/ResponsibilityBadge";
import { SeverityBadge } from "../domain/SeverityBadge";
import { SlaIndicator } from "../domain/SlaIndicator";
import { STATUS_LABELS, type Ticket, type Severity } from "../../lib/types";
import { cn } from "../../utils/cn";

interface TicketTableProps {
  tickets: Ticket[];
  onTicketClick?: (t: Ticket) => void;
}

type SortKey = "id" | "cliente" | "sla" | "score" | "severidade";

export function TicketTable({ tickets, onTicketClick }: TicketTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("sla");
  const [dir, setDir] = useState<"asc" | "desc">("asc");

  const sorted = useMemo(() => {
    const arr = [...tickets];
    arr.sort((a, b) => {
      const mult = dir === "asc" ? 1 : -1;
      const clientA = a.customerName || "";
      const clientB = b.customerName || "";
      const slaA = a.slaHours ?? 24;
      const slaB = b.slaHours ?? 24;

      const scoreA = a.scores
        ? Math.max(a.scores.transporte, a.scores.fabrica, a.scores.montagem)
        : 0;
      const scoreB = b.scores
        ? Math.max(b.scores.transporte, b.scores.fabrica, b.scores.montagem)
        : 0;

      switch (sortKey) {
        case "id":
          return (a.code || a.id).localeCompare(b.code || b.id) * mult;
        case "cliente":
          return clientA.localeCompare(clientB) * mult;
        case "sla":
          return (slaA - slaB) * mult;
        case "score":
          return (scoreA - scoreB) * mult;
        case "severidade":
          return (sevOrder(a.severity) - sevOrder(b.severity)) * mult;
      }
    });
    return arr;
  }, [tickets, sortKey, dir]);

  function toggleSort(k: SortKey) {
    if (k === sortKey) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setDir("asc");
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-steel-700/60 bg-abyss-950/40">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-abyss-900/80 text-[10px] uppercase tracking-[0.18em] text-steel-400">
            <tr>
              <Th onClick={() => toggleSort("id")} active={sortKey === "id"} dir={dir}>
                Ticket
              </Th>
              <Th onClick={() => toggleSort("cliente")} active={sortKey === "cliente"} dir={dir}>
                Cliente / Cidade
              </Th>
              <Th>Status</Th>
              <Th>Responsabilidade</Th>
              <Th onClick={() => toggleSort("score")} active={sortKey === "score"} dir={dir}>
                Triage Score
              </Th>
              <Th onClick={() => toggleSort("severidade")} active={sortKey === "severidade"} dir={dir}>
                Severidade
              </Th>
              <Th onClick={() => toggleSort("sla")} active={sortKey === "sla"} dir={dir}>
                SLA
              </Th>
              <Th>Danfe / Lote</Th>
              <Th className="text-right">Ações</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-steel-700/40">
            {sorted.map((t) => {
              const displayCode = t.code || t.id;
              const displayCustomer = t.customerName || "Cliente não informado";
              const displayCity = t.cityName || "Não especificada";
              const displayNfe = t.nfeKey ? `NF-e ${t.nfeKey.slice(0, 8)}...` : "Sem NF-e";
              const displayBatch = t.batchNumber ? `Lote ${t.batchNumber}` : "Sem lote";

              return (
                <tr
                  key={t.id}
                  onClick={() => onTicketClick?.(t)}
                  className="cursor-pointer text-steel-200 transition-colors hover:bg-abyss-800/40"
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs font-bold text-gold-400">{displayCode}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="max-w-[260px]">
                      <p className="truncate font-semibold text-steel-50">{displayCustomer}</p>
                      <p className="text-[11px] text-steel-400">{displayCity}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[11px] text-steel-300">
                    {STATUS_LABELS[t.status] ?? t.status}
                  </td>
                  <td className="px-4 py-3">
                    <ResponsibilityBadge value={t.suggestedResponsibility ?? "TRANSPORT_DAMAGE"} />
                  </td>
                  <td className="px-4 py-3">
                    <TriageScoreMeter scores={t.scores} size="sm" showLegend={false} />
                  </td>
                  <td className="px-4 py-3">
                    <SeverityBadge value={t.severity ?? "MEDIUM"} />
                  </td>
                  <td className="px-4 py-3">
                    <SlaIndicator hours={t.slaHours ?? 24} />
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-steel-300">
                    <div>{displayNfe}</div>
                    <div className="text-steel-500">{displayBatch}</div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTicketClick?.(t);
                      }}
                      className="inline-flex items-center gap-1 rounded-md border border-gold-500/30 bg-gold-500/5 px-2 py-1 text-[11px] font-semibold text-gold-300 hover:bg-gold-500/15"
                    >
                      Abrir <ExternalLink className="h-3 w-3" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function sevOrder(s?: Severity) {
  if (!s) return 1;
  return { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 }[s];
}

function Th({
  children,
  onClick,
  active,
  dir,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  dir?: "asc" | "desc";
  className?: string;
}) {
  return (
    <th
      onClick={onClick}
      className={cn(
        "whitespace-nowrap px-4 py-3 text-left font-semibold",
        onClick && "cursor-pointer select-none hover:text-gold-300",
        className,
      )}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {onClick &&
          (active ? (
            dir === "asc" ? (
              <ArrowUp className="h-3 w-3" />
            ) : (
              <ArrowDown className="h-3 w-3" />
            )
          ) : (
            <ArrowUpDown className="h-3 w-3 opacity-40" />
          ))}
      </span>
    </th>
  );
}