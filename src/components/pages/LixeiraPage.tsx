import { useCallback, useEffect, useState } from "react";
import { Trash2, RotateCcw, Loader2, AlertTriangle, Clock } from "lucide-react";
import { toast } from "sonner";
import { ticketsService, type TrashedTicket } from "../../services/tickets.service";
import { PageHeader } from "../ui/PageHeader";
import { EmptyState } from "../ui/EmptyState";
import { Button } from "../ui/Button";
import { cn } from "../../utils/cn";

export function LixeiraPage() {
    const [items, setItems] = useState<TrashedTicket[]>([]);
    const [retentionDays, setRetentionDays] = useState<number>(5);
    const [loading, setLoading] = useState<boolean>(true);
    const [restoringId, setRestoringId] = useState<string | null>(null);

    const load = useCallback(async () => {
        try {
            setLoading(true);
            const {trash, retentionDays} = await ticketsService.getTrash();
            setItems(trash);
            setRetentionDays(retentionDays);
        } catch (error) {
            console.error("Erro ao carregar lixeira" ,error);
            toast.error("Não foi possível carregar a lixeira.");            
        } finally {
            setLoading(false);
        }
    }, []);


    useEffect(() => {
        load();
    }, [load]);

    async function handleRestore(id: string, code?: string){
        try {
            setRestoringId(id);
            await ticketsService.restore(id);
            toast.success(`Ticket ${code || ""} restaurado com sucesso.`);
            setItems((prev) => prev.filter((t) => t.id !== id));
        } catch (error: any) {
            const status = error?.response?.status;
            if (status === 410) {
                toast.error("O prazo para restaurar este chamado já espirou.");
            } else {
                toast.error(error?.response?.data?.message || "Erro ao restaurar chamado.")
            }
        } finally {
            setRestoringId(null);
        }
    }
    if (loading) {
        return (
            <div className="felx h-64 items-center justify-center text-steel-400">
                <Loader2 className="h-8 w-8 animate-spin text-gold-500"/>
            </div>
        );
    }
    return (
    <div className="space-y-5">
      <PageHeader
        kicker="FVF CHECK • Sistema"
        title={<span className="text-gold-gradient">Lixeira</span>}
        description={`Chamados excluídos ficam recuperáveis por ${retentionDays} dias antes da remoção definitiva (incluindo fotos e evidências).`}
      />

      {items.length === 0 ? (
        <EmptyState
          title="Lixeira vazia"
          description="Nenhum chamado excluído recentemente."
          icon={<Trash2 className="h-7 w-7" />}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-steel-700/60 bg-abyss-950/40">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-abyss-900/80 text-[10px] uppercase tracking-[0.18em] text-steel-400">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Cód. Chamado</th>
                  <th className="px-4 py-3 text-left font-semibold">Cliente</th>
                  <th className="px-4 py-3 text-left font-semibold">Excluído em</th>
                  <th className="px-4 py-3 text-left font-semibold">Prazo restante</th>
                  <th className="px-4 py-3 text-right font-semibold">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-steel-700/40">
                {items.map((t) => {
                  const urgent = t.daysRemaining <= 1;
                  return (
                    <tr key={t.id} className="text-steel-200 hover:bg-abyss-800/40">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-bold text-gold-400">
                          #{t.code || t.id.slice(0, 6)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {t.customerName || "Cliente não informado"}
                      </td>
                      <td className="px-4 py-3 text-xs text-steel-400">
                        {new Date(t.deletedAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-semibold",
                            urgent
                              ? "border-red-500/40 bg-red-500/10 text-red-300"
                              : "border-amber-500/40 bg-amber-500/10 text-amber-300",
                          )}
                        >
                          {urgent ? (
                            <AlertTriangle className="h-3.5 w-3.5" />
                          ) : (
                            <Clock className="h-3.5 w-3.5" />
                          )}
                          {t.daysRemaining === 0
                            ? "Expira hoje"
                            : `${t.daysRemaining} dia(s) restante(s)`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={restoringId === t.id}
                          onClick={() => handleRestore(t.id, t.code)}
                        >
                          {restoringId === t.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <RotateCcw className="h-3.5 w-3.5" />
                          )}
                          Restaurar
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

}