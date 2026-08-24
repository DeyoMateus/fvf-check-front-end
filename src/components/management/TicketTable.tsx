import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ExternalLink } from "lucide-react";
import { TriageScoreMeter } from "../domain/TriageScoreMeter";
import { ResponsibilityBadge } from "../domain/ResponsibilityBadge";
import { SeverityBadge } from "../domain/SeverityBadge";
import { SlaIndicator } from "../domain/SlaIndicator";
import { STATUS_LABELS, type StatusTicket, type Ticket } from "../../lib/types";
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
      switch (sortKey) {
        case "id":
          return a.id.localeCompare(b.id) * mult;
        case "cliente":
          return a.cliente.localeCompare(b.cliente) * mult;
        case "sla":
          return (a.slaHoras - b.slaHoras) * mult;
        case "score":
          return (
            (Math.max(a.scores.transporte, a.scores.fabrica, a.scores.montagem) -
              Math.max(b.scores.transporte, b.scores.fabrica, b.scores.montagem)) *
            mult
          );
        case "severidade":
          return (sevOrder(a.severidade) - sevOrder(b.severidade)) * mult;
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
            {sorted.map((t) => (
              <tr
                key={t.id}
                onClick={() => onTicketClick?.(t)}
                className="cursor-pointer text-steel-200 transition-colors hover:bg-abyss-800/40"
              >
                <td className="px-4 py-3">
                  <span className="font-mono text-xs font-bold text-gold-400">{t.id}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="max-w-[260px]">
                    <p className="truncate font-semibold text-steel-50">{t.cliente}</p>
                    <p className="text-[11px] text-steel-400">{t.cidade}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-[11px] text-steel-300">
                  {STATUS_LABELS[t.status as StatusTicket]}
                </td>
                <td className="px-4 py-3">
                  <ResponsibilityBadge value={t.responsabilidade} />
                </td>
                <td className="px-4 py-3">
                  <TriageScoreMeter scores={t.scores} size="sm" showLegend={false} />
                </td>
                <td className="px-4 py-3">
                  <SeverityBadge value={t.severidade} />
                </td>
                <td className="px-4 py-3">
                  <SlaIndicator hours={t.slaHoras} />
                </td>
                <td className="px-4 py-3 font-mono text-[11px] text-steel-300">
                  <div>{t.danfe}</div>
                  <div className="text-steel-500">{t.lote}</div>
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function sevOrder(s: Ticket["severidade"]) {
  return { BAIXA: 0, MEDIA: 1, ALTA: 2, CRITICA: 3 }[s];
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
