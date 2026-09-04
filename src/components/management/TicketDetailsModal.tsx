import { useState, useEffect } from "react";
import { useImageViewer } from "../../contexts/ImageViewerContext";
import { EmergencyStatusBanner } from "../domain/EmergencyStatusBanner";

import {
  X,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  FileText,
  Building2,
  Truck,
  Wrench,
  Loader2,
  Trash2,
  Image as ImageIcon,
} from "lucide-react";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { toast } from "sonner";
import {
  ticketsService,
  STATUS_LABELS,
  RESPONSIBILITY_LABELS,
  type Ticket,
  type TicketStatus,
  type ResponsibilityLabel,
  type TicketPart,
  type Media,
} from "../../services/tickets.service";
import { cn } from "../../utils/cn";

interface TicketDetailsModalProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

const STATUS_VARIANTS: Record<
  TicketStatus,
  "warning" | "success" | "danger" | "muted" | "info"
> = {
  OPEN: "warning",
  UNDER_REVIEW: "info",
  APPROVED: "success",
  REJECTED: "danger",
  COMPLETED: "muted",
  CANCELLED: "muted",
};

export function TicketDetailsModal({
  ticket,
  isOpen,
  onClose,
  onRefresh,
}: TicketDetailsModalProps) {
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(ticket);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { open: openImageViewer } = useImageViewer();
  const [selectedResponsibility, setSelectedResponsibility] = useState<
    ResponsibilityLabel | undefined
  >(ticket?.suggestedResponsibility);

  useEffect(() => {
    setCurrentTicket(ticket);
    setSelectedResponsibility(ticket?.suggestedResponsibility);
  }, [ticket]);

  if (!isOpen || !currentTicket) return null;

  async function handleStatusChange(newStatus: TicketStatus) {
    try {
      setUpdating(true);
      await ticketsService.updateStatus(currentTicket!.id, newStatus);
      
      // Atualiza o estado local imediatamente para refletir na UI sem precisar reabrir o modal
      setCurrentTicket((prev) => (prev ? { ...prev, status: newStatus } : null));
      toast.success(`Status atualizado para ${STATUS_LABELS[newStatus] || newStatus}`);
      onRefresh();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast.error("Erro ao atualizar o status do chamado.");
    } finally {
      setUpdating(false);
    }
  }

  async function handleAssignResponsibility(
    responsibility: ResponsibilityLabel
  ) {
    try {
      setUpdating(true);
      setSelectedResponsibility(responsibility);
      await ticketsService.updateResponsibility(currentTicket!.id, responsibility);
      
      setCurrentTicket((prev) => (prev ? { ...prev, suggestedResponsibility: responsibility } : null));
      toast.success("Responsabilidade atribuída com sucesso!");
      onRefresh();
    } catch (error) {
      console.error("Erro ao atribuir responsabilidade:", error);
      toast.error("Erro ao atribuir responsabilidade.");
    } finally {
      setUpdating(false);
    }
  }

  async function handleDeleteTicket() {
    toast("Deseja realmente excluir este chamado?", {
      action: {
        label: "Sim, excluir",
        onClick: async () => {
          try {
            setDeleting(true);
            await ticketsService.delete(currentTicket!.id);
            toast.success("Chamado movido para lixeira, será excluído em 5 dias.");
            onRefresh();
            onClose();
          } catch (error: any) {
            toast.error(
              error?.response?.data?.message ||
                "Você não tem permissão para excluir este chamado (já em andamento)."
            );
          } finally {
            setDeleting(false);
          }
        },
      },
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl border border-steel-700/60 bg-abyss-900 shadow-2xl overflow-hidden text-steel-100">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-steel-800 bg-abyss-950 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold-500/30 bg-gold-500/10 text-gold-300 font-mono text-xs font-bold">
              #{currentTicket.code || currentTicket.id.slice(0, 6)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-steel-50 text-base">
                  Detalhes do Chamado
                </h3>
                <Badge variant={STATUS_VARIANTS[currentTicket.status] || "muted"}>
                  {STATUS_LABELS[currentTicket.status] || currentTicket.status}
                </Badge>
              </div>
              <p className="text-xs text-steel-400">
                Aberto em{" "}
                {currentTicket.createdAt
                  ? new Date(currentTicket.createdAt).toLocaleDateString("pt-BR")
                  : "N/A"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-steel-400 hover:bg-abyss-800 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          <EmergencyStatusBanner
            ticketId={currentTicket.id}
            isEmergencyMode={currentTicket.isEmergencyMode}
        />
          
          {/* Ações Rápidas de Status (Incluindo OPEN, UNDER_REVIEW, APPROVED, REJECTED) */}
          <div className="rounded-xl border border-steel-700/50 bg-abyss-950/60 p-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gold-400 block mb-3">
              Atualizar Status em Tempo Real
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                disabled={updating || currentTicket.status === "OPEN"}
                onClick={() => handleStatusChange("OPEN")}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-all cursor-pointer",
                  currentTicket.status === "OPEN"
                    ? "border-amber-500/50 bg-amber-500/20 text-amber-300 shadow-[inset_0_0_0_1px_rgba(245,158,11,0.3)]"
                    : "border-steel-700 bg-abyss-900 text-steel-300 hover:border-amber-500/40 hover:text-amber-300"
                )}
              >
                <Clock className="h-4 w-4" />
                Aberto
              </button>

              <button
                disabled={updating || currentTicket.status === "UNDER_REVIEW"}
                onClick={() => handleStatusChange("UNDER_REVIEW")}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-all cursor-pointer",
                  currentTicket.status === "UNDER_REVIEW"
                    ? "border-blue-500/50 bg-blue-500/20 text-blue-300 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.3)]"
                    : "border-steel-700 bg-abyss-900 text-steel-300 hover:border-blue-500/40 hover:text-blue-300"
                )}
              >
                <Clock className="h-4 w-4" />
                Em Análise
              </button>

              <button
                disabled={updating || currentTicket.status === "APPROVED"}
                onClick={() => handleStatusChange("APPROVED")}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-all cursor-pointer",
                  currentTicket.status === "APPROVED"
                    ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-300 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.3)]"
                    : "border-steel-700 bg-abyss-900 text-steel-300 hover:border-emerald-500/40 hover:text-emerald-300"
                )}
              >
                <CheckCircle2 className="h-4 w-4" />
                Aprovar
              </button>

              <button
                disabled={updating || currentTicket.status === "REJECTED"}
                onClick={() => handleStatusChange("REJECTED")}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-all cursor-pointer",
                  currentTicket.status === "REJECTED"
                    ? "border-red-500/50 bg-red-500/20 text-red-300 shadow-[inset_0_0_0_1px_rgba(239,68,68,0.3)]"
                    : "border-steel-700 bg-abyss-900 text-steel-300 hover:border-red-500/40 hover:text-red-300"
                )}
              >
                <XCircle className="h-4 w-4" />
                Rejeitar
              </button>
            </div>
          </div>

          {/* Atribuição de Responsabilidade */}
          <div className="rounded-xl border border-steel-700/50 bg-abyss-950/60 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-steel-400">
                Atribuição de Responsabilidade
              </span>
              {updating && (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-gold-400" />
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                {
                  id: "TRANSPORT_DAMAGE" as ResponsibilityLabel,
                  label: RESPONSIBILITY_LABELS.TRANSPORT_DAMAGE,
                  icon: Truck,
                },
                {
                  id: "FACTORY_DEFECT" as ResponsibilityLabel,
                  label: RESPONSIBILITY_LABELS.FACTORY_DEFECT,
                  icon: Building2,
                },
                {
                  id: "ASSEMBLY_ERROR" as ResponsibilityLabel,
                  label: RESPONSIBILITY_LABELS.ASSEMBLY_ERROR,
                  icon: Wrench,
                },
              ].map(({ id, label, icon: Icon }) => {
                const active =
                  (selectedResponsibility || currentTicket.suggestedResponsibility) === id;
                return (
                  <button
                    key={id}
                    disabled={updating}
                    onClick={() => handleAssignResponsibility(id)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg border p-2.5 text-xs font-semibold transition-all text-left cursor-pointer",
                      active
                        ? "border-gold-500/60 bg-gold-500/10 text-gold-200 shadow-[inset_0_0_0_1px_rgba(227,185,33,0.3)]"
                        : "border-steel-700/60 bg-abyss-900/60 text-steel-300 hover:text-steel-100"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        active ? "text-gold-400" : "text-steel-400"
                      )}
                    />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dados do Consumidor e NF-e */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl border border-steel-800 bg-abyss-950/40 p-4 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-steel-500 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-gold-400" /> Consumidor
              </span>
              <p className="font-semibold text-steel-100">
                {currentTicket.customerName || "Não informado"}
              </p>
              <p className="text-steel-400">
                {currentTicket.customerPhone || "Sem telefone"}
              </p>
            </div>

            <div className="rounded-xl border border-steel-800 bg-abyss-950/40 p-4 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-steel-500 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-gold-400" /> Nota Fiscal (DANFE)
              </span>
              <p className="font-mono text-steel-100 truncate">
                {currentTicket.nfeKey || "N/A"}
              </p>
              <p className="text-steel-400">
                Embalagem:{" "}
                <strong className="text-steel-200">
                  {currentTicket.packageCondition === "DAMAGED"
                    ? "Avariada"
                    : "Intacta"}
                </strong>
              </p>
            </div>
          </div>

          {/* Peças Avariadas Registradas */}
          <div className="rounded-xl border border-steel-800 bg-abyss-950/40 p-4 space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-steel-400 block">
              Peças / Defeitos Notificados ({currentTicket.parts?.length || 0})
            </span>
            {!currentTicket.parts || currentTicket.parts.length === 0 ? (
              <p className="text-xs text-steel-500 italic">
                Nenhuma peça listada diretamente.
              </p>
            ) : (
              <div className="space-y-2">
                {currentTicket.parts.map((part: TicketPart, i: number) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border border-steel-800 bg-abyss-900/60 p-3 text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-gold-300">
                        {part.partCode}
                      </span>
                      {part.emergencyNotes && (
                        <p className="mt-0.5 text-steel-400">
                          {part.emergencyNotes}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant={
                        part.defectType === "BROKEN" ? "danger" : "warning"
                      }
                    >
                      {part.defectType} ({part.quantity}x)
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mídias / Evidências */}
          <div className="rounded-xl border border-steel-800 bg-abyss-950/40 p-4 space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-steel-400 flex items-center gap-1.5">
              <ImageIcon className="h-3.5 w-3.5 text-gold-400" /> Evidências Anexadas ({currentTicket.mediaFiles?.length || 0})
            </span>
            {!currentTicket.mediaFiles || currentTicket.mediaFiles.length === 0 ? (
              <p className="text-xs text-steel-500 italic">
                Nenhuma evidência registrada.
              </p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {currentTicket.mediaFiles.map((m: Media, idx: number) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() =>
                      openImageViewer(
                        (currentTicket.mediaFiles ?? []).map((mf) => ({ url: mf.url, label: mf.type })),
                        idx,
                      )
                    }
                   className="group relative aspect-square overflow-hidden rounded-lg border border-steel-700 bg-abyss-900 hover:border-gold-500 transition-all"
                  >
                    <img
                      src={m.url}
                      alt="Evidência"
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                    <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 py-0.5 text-[9px] font-mono text-white">
                      {m.type}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Rodapé com Ação de Excluir e Fechar */}
        <div className="flex items-center justify-between border-t border-steel-800 bg-abyss-950 px-6 py-4">
          <Button
            type="button"
            variant="danger"
            onClick={handleDeleteTicket}
            disabled={deleting}
            className="flex items-center gap-1.5 text-xs bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 cursor-pointer"
          >
            {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            Excluir Chamado
          </Button>

          <Button type="button" variant="secondary" onClick={onClose} className="cursor-pointer">
            Fechar
          </Button>
        </div>

      </div>
    </div>
  );
}