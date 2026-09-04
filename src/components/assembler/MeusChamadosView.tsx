import { Loader2, WifiOff, RefreshCw, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { useMontadorTickets, type MontadorTicketItem } from "../../hooks/useMontadorTickets";
import { retryTicket } from "../../lib/offline/sync-engine";
import { STATUS_LABELS } from "../../services/tickets.service";
import { cn } from "../../utils/cn";

export function MeusChamadosView() {
  const { items, loading, serverUnavailable, reload } = useMontadorTickets();

  if (loading && items.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-steel-400">
        <Loader2 className="h-6 w-6 animate-spin text-gold-400" />
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-steel-50">Meus Chamados</h2>
        <button onClick={() => reload()} className="text-steel-400 hover:text-gold-300">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {serverUnavailable && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
          <WifiOff className="h-4 w-4 shrink-0" />
          Sem conexão com o servidor — mostrando apenas chamados salvos neste aparelho.
        </div>
      )}

      {items.length === 0 ? (
        <p className="py-8 text-center text-xs text-steel-500">
          Nenhum chamado registrado ainda.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <TicketRow key={rowKey(item)} item={item} onRetry={reload} />
          ))}
        </ul>
      )}
    </div>
  );
}

function rowKey(item: MontadorTicketItem) {
  return item.kind === "synced" ? `s-${item.ticket.id}` : `o-${item.record.localId}`;
}

function TicketRow({ item, onRetry }: { item: MontadorTicketItem; onRetry: () => void }) {
  if (item.kind === "synced") {
    const t = item.ticket;
    return (
      <li className="flex items-center justify-between rounded-lg border border-steel-700/50 bg-abyss-900/60 p-3 text-xs">
        <div>
          <p className="font-mono font-bold text-gold-300">{t.code || t.id.slice(0, 8)}</p>
          <p className="mt-0.5 text-steel-400">{t.customerName || "Cliente não informado"}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-emerald-300">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {STATUS_LABELS[t.status] || t.status}
        </span>
      </li>
    );
  }

  const r = item.record;
  const isError = r.status === "error";
  const isSyncing = r.status === "syncing";

  return (
    <li className="flex items-center justify-between rounded-lg border border-steel-700/50 bg-abyss-900/60 p-3 text-xs">
      <div>
        <p className="font-semibold text-steel-100">{r.payload.invoice.customer.name}</p>
        <p className="mt-0.5 text-steel-400">
          {r.payload.parts.length} peça(s) • {r.mediaCount} evidência(s)
        </p>
        {isError && r.errorMessage && (
          <p className="mt-1 text-red-400">{r.errorMessage}</p>
        )}
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border px-2 py-1",
            isError
              ? "border-red-500/30 bg-red-500/10 text-red-300"
              : isSyncing
                ? "border-sky-500/30 bg-sky-500/10 text-sky-300"
                : "border-amber-500/30 bg-amber-500/10 text-amber-300",
          )}
        >
          {isError ? (
            <AlertTriangle className="h-3.5 w-3.5" />
          ) : isSyncing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Clock className="h-3.5 w-3.5" />
          )}
          {isError ? "Falhou" : isSyncing ? "Enviando..." : "Aguardando internet"}
        </span>
        {isError && (
          <button
            onClick={async () => {
              await retryTicket(r.localId);
              onRetry();
            }}
            className="text-[10px] font-semibold text-gold-300 hover:underline"
          >
            Tentar novamente
          </button>
        )}
      </div>
    </li>
  );
}