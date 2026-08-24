import { useMemo, useState, type DragEvent } from "react";
import { Inbox, Filter, ArrowUpDown, Loader2 } from "lucide-react";
import {
  STATUS_LABELS,
  STATUS_ORDER,
  type StatusTicket,
  type Ticket,
} from "../../lib/types";
import { TicketCard } from "../domain/TicketCard";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Tabs } from "../ui/Tabs";
import { cn } from "../../utils/cn";

interface TicketKanbanBoardProps {
  tickets: Ticket[];
  isLoading?: boolean;
  onTicketClick?: (t: Ticket) => void;
}

type FilterResp = "TODOS" | "TRANSPORTE" | "FABRICA" | "MONTAGEM";
type SortMode = "sla" | "score" | "recente";

const COL_ACCENT: Record<StatusTicket, string> = {
  ABERTO: "before:bg-red-500",
  TRIAGEM: "before:bg-gold-500",
  EM_ANALISE: "before:bg-sky-500",
  RESOLVIDO: "before:bg-emerald-500",
  CANCELADO: "before:bg-steel-500",
};

export function TicketKanbanBoard({
  tickets,
  isLoading,
  onTicketClick,
}: TicketKanbanBoardProps) {
  const [items, setItems] = useState<Ticket[]>(tickets);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<StatusTicket | null>(null);
  const [filter, setFilter] = useState<FilterResp>("TODOS");
  const [sort, setSort] = useState<SortMode>("sla");

  // Sincroniza mock externo
  useMemo(() => setItems(tickets), [tickets]);

  const filtered = useMemo(() => {
    let arr = items;
    if (filter !== "TODOS") arr = arr.filter((t) => t.responsabilidade === filter);
    if (sort === "sla") arr = [...arr].sort((a, b) => a.slaHoras - b.slaHoras);
    if (sort === "recente") {
      arr = [...arr].sort(
        (a, b) => new Date(b.abertoEm).getTime() - new Date(a.abertoEm).getTime(),
      );
    }
    if (sort === "score") {
      arr = [...arr].sort(
        (a, b) =>
          Math.max(b.scores.transporte, b.scores.fabrica, b.scores.montagem) -
          Math.max(a.scores.transporte, a.scores.fabrica, a.scores.montagem),
      );
    }
    return arr;
  }, [items, filter, sort]);

  function handleDragStart(e: DragEvent<HTMLDivElement>, id: string) {
    setDragId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  }
  function handleDragOver(e: DragEvent<HTMLDivElement>, col: StatusTicket) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(col);
  }
  function handleDrop(e: DragEvent<HTMLDivElement>, col: StatusTicket) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || dragId;
    if (!id) return;
    setItems((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: col } : t)),
    );
    setDragId(null);
    setDragOver(null);
  }
  function handleDragEnd() {
    setDragId(null);
    setDragOver(null);
  }

  return (
    <section className="flex h-full flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <Tabs<FilterResp>
          value={filter}
          onChange={setFilter}
          options={[
            { value: "TODOS", label: "Todos" },
            { value: "TRANSPORTE", label: "Transporte" },
            { value: "FABRICA", label: "Fábrica" },
            { value: "MONTAGEM", label: "Montagem" },
          ]}
        />
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-steel-400 sm:inline-flex">
            <ArrowUpDown className="h-3 w-3" />
            Ordenar
          </span>
          <Tabs<SortMode>
            value={sort}
            onChange={setSort}
            options={[
              { value: "sla", label: "SLA" },
              { value: "score", label: "Score" },
              { value: "recente", label: "Recente" },
            ]}
          />
          <Button variant="ghost" size="icon" aria-label="Filtros avançados">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Board */}
      {isLoading ? (
        <BoardSkeleton />
      ) : (
        <div className="grid flex-1 grid-cols-1 gap-4 overflow-x-auto md:grid-cols-2 xl:grid-cols-4">
          {STATUS_ORDER.map((status) => {
            const col = filtered.filter((t) => t.status === status);
            const isOver = dragOver === status;
            return (
              <div
                key={status}
                onDragOver={(e) => handleDragOver(e, status)}
                onDragLeave={() => setDragOver(null)}
                onDrop={(e) => handleDrop(e, status)}
                className={cn(
                  "relative flex min-h-[400px] flex-col rounded-xl border bg-abyss-950/40 p-3 transition-colors",
                  "before:absolute before:left-0 before:right-0 before:top-0 before:h-0.5 before:rounded-t-xl",
                  COL_ACCENT[status],
                  isOver
                    ? "border-gold-400/60 bg-gold-500/5"
                    : "border-steel-700/40",
                )}
              >
                {/* Col header */}
                <div className="mb-3 flex items-center justify-between px-1">
                  <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-steel-200">
                    {STATUS_LABELS[status]}
                  </h3>
                  <Badge variant={col.length ? "gold" : "muted"}>
                    {col.length}
                  </Badge>
                </div>

                {/* Cards */}
                <div className="flex flex-1 flex-col gap-3 overflow-y-auto pr-1">
                  {col.length === 0 ? (
                    <EmptyColumn />
                  ) : (
                    col.map((t) => (
                      <div
                        key={t.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, t.id)}
                        onDragEnd={handleDragEnd}
                        className={cn(
                          "cursor-grab active:cursor-grabbing transition-opacity",
                          dragId === t.id && "opacity-40",
                        )}
                      >
                        <TicketCard
                          ticket={t}
                          onClick={() => onTicketClick?.(t)}
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function EmptyColumn() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-steel-700/40 bg-abyss-900/20 p-6 text-center">
      <Inbox className="h-8 w-8 text-steel-600" />
      <p className="mt-2 text-xs font-semibold text-steel-400">Sem tickets</p>
      <p className="mt-1 text-[11px] text-steel-500">
        Arraste um card para esta coluna
      </p>
    </div>
  );
}

function BoardSkeleton() {
  return (
    <div className="flex h-64 items-center justify-center rounded-xl border border-steel-700/40 bg-abyss-950/40">
      <div className="flex flex-col items-center gap-3 text-steel-400">
        <Loader2 className="h-6 w-6 animate-spin text-gold-400" />
        <p className="text-xs uppercase tracking-widest">Carregando triagem…</p>
      </div>
    </div>
  );
}
