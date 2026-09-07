import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  X,
  MessageSquare,
  Paperclip,
  Camera,
  Truck,
  Factory,
  Wrench,
  CheckCircle2,
  FileDown,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { TriageScoreMeter } from "../domain/TriageScoreMeter";
import { SeverityBadge } from "../domain/SeverityBadge";
import { SlaIndicator } from "../domain/SlaIndicator";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { useImageViewer } from "../../contexts/ImageViewerContext";
import { EmergencyStatusBanner } from "../domain/EmergencyStatusBanner";
import { ReverseLogisticsPanel } from "./ReverseLogisticsPanel";
import { PackageX } from "lucide-react"; // adicionar ao import já existente de lucide-react
import {
  ticketsService,
  VISIT_STATUS_LABELS,
  CLAIM_STATUS_LABELS,
  RMA_STATUS_LABELS,
  type Ticket,
  type TicketPart,
  type TicketStatus,
  type ClaimStatus,
  type RmaStatus,
  type TicketEvent,
} from "../../services/tickets.service";
import { toast } from "sonner";

export interface TicketDrawerProps {
  ticket: Ticket | null;
  onClose: () => void;
  onStatusChange?: (
    ticketId: string,
    newStatus: TicketStatus,
  ) => Promise<void> | void;
  onAddComment?: (ticketId: string, comment: string) => Promise<void> | void;
  onTriggerAction?: (actionType: string, ticketId: string) => void;
  onRefreshTicket?: () => void;
  onViewEvidence?: (part: TicketPart) => void;
}

const AVAILABLE_STATUSES: { value: TicketStatus; label: string }[] = [
  { value: "OPEN", label: "Aberto" },
  { value: "UNDER_REVIEW", label: "Em Análise" },
  { value: "APPROVED", label: "Aprovado" },
  { value: "REJECTED", label: "Rejeitado" },
  { value: "COMPLETED", label: "Concluído" },
  { value: "CANCELLED", label: "Cancelado" },
];

function extractPartDetails(part: TicketPart) {
  const raw = part as unknown as Record<string, unknown>;

  const partCode = String(raw.partCode || raw.code || raw.sku || "Sem código");

  const partName = String(
    raw.partName ||
      raw.descricao ||
      raw.name ||
      raw.title ||
      `Peça (${partCode})`,
  );

  const score =
    typeof raw.score === "number"
      ? raw.score
      : typeof raw.scoreVal === "number"
        ? raw.scoreVal
        : typeof raw.confidence === "number"
          ? raw.confidence
          : 0;

  const mediaList = Array.isArray(raw.media)
    ? (raw.media as unknown[])
    : Array.isArray(raw.photos)
      ? (raw.photos as unknown[])
      : Array.isArray(raw.evidencias)
        ? (raw.evidencias as unknown[])
        : [];

  const evidenceCount =
    mediaList.length > 0
      ? mediaList.length
      : Number(raw.evidenceCount || raw.evidencia || 0);

  const defectType = String(
    raw.defectType || raw.defeito || raw.type || "Geral",
  );

  return {
    partCode,
    partName,
    score,
    evidenceCount,
    mediaList,
    defectType,
  };
}

export function TicketDrawer({
  ticket,
  onClose,
  onStatusChange,
  onAddComment,
  onTriggerAction,
  onRefreshTicket,
  onViewEvidence,
}: TicketDrawerProps) {
  const [isCommenting, setIsCommenting] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [isSchedulingVisit, setIsSchedulingVisit] = useState(false);
  const [isHandlingClaim, setIsHandlingClaim] = useState(false);
  const [isHandlingRma, setIsHandlingRma] = useState(false);
  const [isHandlingReverseLogistics, setIsHandlingReverseLogistics] =
    useState(false);

  const actionPanelRef = useRef<HTMLElement>(null);
  const { open: openImageViewer } = useImageViewer();
  const [selectedNewStatus, setSelectedNewStatus] = useState<TicketStatus>(
    ticket?.status || "UNDER_REVIEW",
  );
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Visita Técnica
  const [assemblers, setAssemblers] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [selectedAssemblerId, setSelectedAssemblerId] = useState("");
  const [selectedVisitDateTime, setSelectedVisitDateTime] = useState("");

  // Sinistro
  const [carrierName, setCarrierName] = useState("");
  const [claimNumber, setClaimNumber] = useState("");
  const [claimedValue, setClaimedValue] = useState<string>("");
  const [claimStatus, setClaimStatus] = useState<ClaimStatus>("OPEN");

  // RMA
  const [rmaNumber, setRmaNumber] = useState("");
  const [responseDueAt, setResponseDueAt] = useState("");
  const [rmaStatus, setRmaStatus] = useState<RmaStatus>("REQUESTED");

  const [exportingPdf, setExportingPdf] = useState(false);

  useEffect(() => {
    ticketsService.getAssemblers().then(setAssemblers);
  }, []);

  useEffect(() => {
    if (ticket) {
      if (ticket.status) {
        setSelectedNewStatus(ticket.status);
      }
      if (ticket.transportClaim) {
        setCarrierName(ticket.transportClaim.carrierName);
        setClaimNumber(ticket.transportClaim.claimNumber);
        setClaimedValue(ticket.transportClaim.claimedValue?.toString() || "");
        setClaimStatus(ticket.transportClaim.status as ClaimStatus);
      }
      if (ticket.factoryRma) {
        setRmaNumber(ticket.factoryRma.rmaNumber);
        setResponseDueAt(
          ticket.factoryRma.responseDueAt
            ? new Date(ticket.factoryRma.responseDueAt)
                .toISOString()
                .slice(0, 16)
            : "",
        );
        setRmaStatus(ticket.factoryRma.status as RmaStatus);
      }
    }
  }, [ticket]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (
      isChangingStatus ||
      isCommenting ||
      isSchedulingVisit ||
      isHandlingClaim ||
      isHandlingRma
    ) {
      actionPanelRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [
    isChangingStatus,
    isCommenting,
    isSchedulingVisit,
    isHandlingClaim,
    isHandlingRma,
  ]);

  if (!ticket) return null;

  const displayCode = ticket.code || ticket.id;
  const displayCustomer = ticket.customerName || "Cliente não informado";
  const displayCity = ticket.cityName || "Não especificada";
  const displayNfe = ticket.nfeKey
    ? `NF-e ${ticket.nfeKey.slice(0, 8)}...`
    : "Sem NF-e";
  const displayBatch = ticket.batchNumber
    ? `Lote ${ticket.batchNumber}`
    : "Sem lote";
  const partsList = ticket.parts ?? [];

  const resetPanels = () => {
    setIsChangingStatus(false);
    setIsCommenting(false);
    setIsSchedulingVisit(false);
    setIsHandlingClaim(false);
    setIsHandlingRma(false);
    setIsHandlingReverseLogistics(false);
  };

  const handleConfirmStatusChange = async () => {
    if (!onStatusChange || !ticket) return;

    setIsSubmitting(true);
    try {
      await onStatusChange(ticket.id, selectedNewStatus);
      setIsChangingStatus(false);
    } catch (error) {
      console.error("Erro ao atualizar status do ticket:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveComment = async () => {
    if (!commentText.trim()) return;
    if (onAddComment) {
      setIsSubmitting(true);
      try {
        await onAddComment(ticket.id, commentText);
        setCommentText("");
        setIsCommenting(false);
      } catch (error) {
        console.error("Erro ao salvar comentário:", error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleSaveClaim = async () => {
    if (!ticket) return;
    setIsSubmitting(true);
    try {
      if (ticket.transportClaim) {
        await ticketsService.updateClaimStatus(ticket.id, claimStatus);
      } else {
        if (!carrierName || !claimNumber) return;
        await ticketsService.openClaim(ticket.id, {
          carrierName,
          claimNumber,
          claimedValue: claimedValue ? parseFloat(claimedValue) : undefined,
        });
      }
      setIsHandlingClaim(false);
      onRefreshTicket?.();
    } catch (error) {
      console.error("Erro ao salvar sinistro:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveRma = async () => {
    if (!ticket) return;
    setIsSubmitting(true);
    try {
      if (ticket.factoryRma) {
        await ticketsService.updateRmaStatus(ticket.id, rmaStatus);
      } else {
        await ticketsService.requestRma(ticket.id, {
          responseDueAt: responseDueAt
            ? new Date(responseDueAt).toISOString()
            : undefined,
        });

        toast.success("RMA gerado e endereçado à Fábrica fornecedora.");
      }
      setIsHandlingRma(false);
      onRefreshTicket?.();
    } catch (error) {
      console.error("Erro ao salvar RMA:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-abyss-950/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <aside
        role="dialog"
        aria-modal="true"
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-xl flex-col border-l border-steel-700/60 bg-gradient-to-b from-abyss-900 to-abyss-950 shadow-2xl"
      >
        {/* Header */}
        <header className="flex items-start justify-between gap-3 border-b border-steel-700/40 p-5">
          <div>
            <p className="font-mono text-xs font-bold text-gold-400">
              {displayCode}
            </p>
            <h2 className="mt-1 text-lg font-semibold text-steel-50">
              {displayCustomer}
            </h2>
            <p className="text-xs text-steel-400">{displayCity}</p>

            {ticket.product?.tenant && (
              <p className="mt-1 flex items-center gap-1.5 text-[11px] text-steel-400">
                <Factory className="h-3 w-3 text-gold-400" />
                Fabricante:{" "}
                <span className="font-semibold text-gold-300">
                  {ticket.product.tenant.name}
                </span>
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <SeverityBadge value={ticket.severity ?? "MEDIUM"} />
              <SlaIndicator hours={ticket.slaHours ?? 24} />
              <Badge variant="outline">{displayNfe}</Badge>
              <Badge variant="muted">{displayBatch}</Badge>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-steel-700/60 text-steel-300 hover:bg-abyss-800/60 cursor-pointer"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto p-5">
          <EmergencyStatusBanner
            ticketId={ticket.id}
            isEmergencyMode={ticket.isEmergencyMode}
          />

          {/* Triage Score */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gold-400 hud-line-left">
              Triage Score
            </h3>
            <div className="mt-4 rounded-xl border border-steel-700/50 bg-abyss-900/60 p-5">
              <TriageScoreMeter scores={ticket.scores} size="md" showLegend />
              <p className="mt-4 text-xs leading-relaxed text-steel-400">
                Modelo de IA priorizou a hipótese{" "}
                <span className="font-semibold text-gold-300">
                  {topLabel(ticket)}
                </span>{" "}
                com base em evidências fotográficas, padrão do lote e histórico
                do montador.
              </p>
            </div>
          </section>

          {/* Peças Avariadas */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gold-400 hud-line-left">
              Peças Avariadas ({partsList.length})
            </h3>
            <ul className="mt-4 space-y-3">
              {partsList.map((p, idx) => {
                const part = extractPartDetails(p);

                return (
                  <li
                    key={p.id || idx}
                    className="rounded-xl border border-steel-700/50 bg-abyss-900/60 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-steel-100">
                          {part.partName}
                        </p>
                        <p className="mt-0.5 text-[11px] text-steel-400">
                          Código:{" "}
                          <span className="font-mono">{part.partCode}</span> |
                          Defeito: {part.defectType}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-steel-500">
                          Score
                        </p>
                        <p className="font-mono text-lg font-bold text-gold-300">
                          {part.score}%
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-steel-700/40 pt-3 text-[11px] text-steel-400">
                      <span className="inline-flex items-center gap-1.5">
                        <Camera className="h-3 w-3" />
                        {part.evidenceCount} foto
                        {part.evidenceCount !== 1 && "s"}
                      </span>
                      <button
                        onClick={() => {
                          const ownMedia = part.mediaList as unknown as {
                            url: string;
                            type?: string;
                          }[];
                          const images = (
                            ownMedia.length > 0
                              ? ownMedia
                              : (ticket.mediaFiles ?? [])
                          ).map((m: any) => ({ url: m.url, label: m.type }));
                          if (onViewEvidence) onViewEvidence(p);
                          else if (images.length) openImageViewer(images, 0);
                        }}
                        className="font-semibold text-gold-300 hover:underline cursor-pointer"
                      >
                        Ver evidência →
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Ações por responsabilidade */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gold-400 hud-line-left">
              Ações Recomendadas
            </h3>
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <ActionCard
                icon={<Truck className="h-4 w-4" />}
                label={
                  ticket.transportClaim
                    ? `Sinistro: ${CLAIM_STATUS_LABELS[ticket.transportClaim.status as ClaimStatus]}`
                    : "Abrir sinistro c/ transportadora"
                }
                tone="warning"
                onClick={() => {
                  onTriggerAction?.("TRANSPORTE_CLAIM", ticket.id);
                  resetPanels();
                  setIsHandlingClaim(!isHandlingClaim);
                }}
              />
              <ActionCard
                icon={<Factory className="h-4 w-4" />}
                label={
                  ticket.factoryRma
                    ? `RMA: ${RMA_STATUS_LABELS[ticket.factoryRma.status as RmaStatus]}`
                    : "Solicitar RMA à fábrica"
                }
                tone="danger"
                onClick={() => {
                  onTriggerAction?.("FACTORY_RMA", ticket.id);
                  resetPanels();
                  setIsHandlingRma(!isHandlingRma);
                }}
              />
              <ActionCard
                icon={<Wrench className="h-4 w-4" />}
                label={
                  ticket.technicalVisit?.status
                    ? `Visita: ${VISIT_STATUS_LABELS[ticket.technicalVisit.status as keyof typeof VISIT_STATUS_LABELS]}`
                    : "Agendar visita técnica"
                }
                tone="info"
                onClick={() => {
                  setSelectedAssemblerId(
                    ticket.technicalVisit?.assemblerId ?? "",
                  );
                  resetPanels();
                  setIsSchedulingVisit(!isSchedulingVisit);
                }}
              />
              <ActionCard
                icon={<PackageX className="h-4 w-4" />}
                label={
                  ticket.reverseLogistics && ticket.reverseLogistics !== "NONE"
                    ? ticket.reverseLogistics === "REQUIRED"
                      ? "Retorno exigido"
                      : "Descarte autorizado"
                    : "Decidir logística reversa"
                }
                tone="danger"
                onClick={() => {
                  resetPanels();
                  setIsHandlingReverseLogistics(!isHandlingReverseLogistics);
                }}
              />
            </div>
          </section>

          {/* Seção para Sinistro com Transportadora */}
          {isHandlingClaim && (
            <section
              ref={actionPanelRef}
              className="rounded-xl border border-gold-500/30 bg-abyss-900/80 p-4 animate-in fade-in duration-200 space-y-3"
            >
              <h4 className="text-xs font-bold text-gold-300">
                {ticket.transportClaim
                  ? "Atualizar Sinistro"
                  : "Abrir Sinistro c/ Transportadora"}
              </h4>
              {!ticket.transportClaim ? (
                <>
                  <input
                    type="text"
                    placeholder="Nome da Transportadora"
                    value={carrierName}
                    onChange={(e) => setCarrierName(e.target.value)}
                    className="w-full rounded-lg border border-steel-700 bg-abyss-950 p-2 text-xs text-steel-100 focus:border-gold-400 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Número do Sinistro"
                    value={claimNumber}
                    onChange={(e) => setClaimNumber(e.target.value)}
                    className="w-full rounded-lg border border-steel-700 bg-abyss-950 p-2 text-xs text-steel-100 focus:border-gold-400 focus:outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Valor Reclamado (R$)"
                    value={claimedValue}
                    onChange={(e) => setClaimedValue(e.target.value)}
                    className="w-full rounded-lg border border-steel-700 bg-abyss-950 p-2 text-xs text-steel-100 focus:border-gold-400 focus:outline-none"
                  />
                </>
              ) : (
                <select
                  value={claimStatus}
                  onChange={(e) =>
                    setClaimStatus(e.target.value as ClaimStatus)
                  }
                  className="w-full rounded-lg border border-steel-700 bg-abyss-950 p-2 text-xs text-steel-100 focus:border-gold-400 focus:outline-none cursor-pointer"
                >
                  {Object.entries(CLAIM_STATUS_LABELS).map(([val, lbl]) => (
                    <option key={val} value={val}>
                      {lbl}
                    </option>
                  ))}
                </select>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsHandlingClaim(false)}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveClaim}
                  disabled={
                    isSubmitting ||
                    (!ticket.transportClaim && (!carrierName || !claimNumber))
                  }
                >
                  {isSubmitting ? "Salvando..." : "Salvar Sinistro"}
                </Button>
              </div>
            </section>
          )}

          {/* Seção para RMA com a Fábrica */}
          {isHandlingRma && (
            <section
              ref={actionPanelRef}
              className="rounded-xl border border-gold-500/30 bg-abyss-900/80 p-4 animate-in fade-in duration-200 space-y-3"
            >
              <h4 className="text-xs font-bold text-gold-300">
                {ticket.factoryRma
                  ? "Atualizar RMA"
                  : "Solicitar RMA à Fábrica"}
              </h4>
              {!ticket.factoryRma ? (
                <>
                  <p className="text-[11px] text-steel-400">
                    O número do RMA será gerado automaticamente e endereçado ao
                    Administrador da Fábrica fornecedora.
                  </p>
                  <input
                    type="datetime-local"
                    value={responseDueAt}
                    onChange={(e) => setResponseDueAt(e.target.value)}
                    placeholder="Prazo de resposta (opcional)"
                    className="w-full rounded-lg border border-steel-700 bg-abyss-950 p-2 text-xs text-steel-100 focus:border-gold-400 focus:outline-none"
                  />
                </>
              ) : (
                <select
                  value={rmaStatus}
                  onChange={(e) => setRmaStatus(e.target.value as RmaStatus)}
                  className="w-full rounded-lg border border-steel-700 bg-abyss-950 p-2 text-xs text-steel-100 focus:border-gold-400 focus:outline-none cursor-pointer"
                >
                  {Object.entries(RMA_STATUS_LABELS).map(([val, lbl]) => (
                    <option key={val} value={val}>
                      {lbl}
                    </option>
                  ))}
                </select>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsHandlingRma(false)}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveRma}
                  disabled={isSubmitting || (!ticket.factoryRma && !rmaNumber)}
                >
                  {isSubmitting ? "Salvando..." : "Salvar RMA"}
                </Button>
              </div>
            </section>
          )}

          {isHandlingReverseLogistics && (
            <ReverseLogisticsPanel
              ticket={ticket}
              onClose={() => setIsHandlingReverseLogistics(false)}
              onUpdated={() => onRefreshTicket?.()}
            />
          )}

          {/* Histórico Dinâmico com fallback */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gold-400 hud-line-left">
              Histórico
            </h3>
            <ol className="mt-4 space-y-3 border-l-2 border-gold-500/20 pl-4">
              {ticket.events && ticket.events.length > 0 ? (
                ticket.events.map((evt: TicketEvent, i: number) => (
                  <TimelineItem
                    key={evt.id || i}
                    when={new Date(evt.createdAt).toLocaleString("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                    who={evt.actor?.name || "Sistema"}
                    desc={evt.message}
                    current={i === ticket.events!.length - 1}
                  />
                ))
              ) : (
                <>
                  <TimelineItem
                    when="há 2h"
                    who="Sistema"
                    desc="DANFE lido e ticket criado."
                  />
                  <TimelineItem
                    when="há 1h"
                    who="IA de Visão"
                    desc={`Detectou padrão compatível com ${topLabel(ticket).toLowerCase()}.`}
                  />
                  <TimelineItem
                    when="agora"
                    who="Operador"
                    desc={`Status atual: ${ticket.status || "OPEN"}`}
                    current
                  />
                </>
              )}
            </ol>
          </section>

          {/* Seção para Alterar Status Manualmente */}
          {isChangingStatus && (
            <section
              ref={actionPanelRef}
              className="rounded-xl border border-gold-500/30 bg-abyss-900/80 p-4 animate-in fade-in duration-200"
            >
              <h4 className="text-xs font-bold text-gold-300 mb-2">
                Selecione o Novo Status do Ticket
              </h4>
              <div className="space-y-3">
                <select
                  value={selectedNewStatus}
                  onChange={(e) =>
                    setSelectedNewStatus(e.target.value as TicketStatus)
                  }
                  className="w-full rounded-lg border border-steel-700 bg-abyss-950 p-2 text-xs text-steel-100 focus:border-gold-400 focus:outline-none cursor-pointer"
                >
                  {AVAILABLE_STATUSES.map((st) => (
                    <option key={st.value} value={st.value}>
                      {st.label} ({st.value})
                    </option>
                  ))}
                </select>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsChangingStatus(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleConfirmStatusChange}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Atualizando..." : "Confirmar Alteração"}
                  </Button>
                </div>
              </div>
            </section>
          )}

          {/* Seção de Comentário Rápido */}
          {isCommenting && (
            <section
              ref={actionPanelRef}
              className="rounded-xl border border-gold-500/30 bg-abyss-900/80 p-4 animate-in fade-in duration-200"
            >
              <h4 className="text-xs font-bold text-gold-300 mb-2">
                Adicionar Nota de Auditoria
              </h4>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Digite detalhes da tratativa ou observação..."
                className="w-full rounded-lg border border-steel-700 bg-abyss-950 p-2 text-xs text-steel-100 focus:border-gold-400 focus:outline-none"
                rows={3}
              />
              <div className="mt-2 flex justify-end gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsCommenting(false)}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveComment}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Salvando..." : "Salvar Nota"}
                </Button>
              </div>
            </section>
          )}

          {/* Seção de Agendar Visita */}
          {isSchedulingVisit && (
            <section
              ref={actionPanelRef}
              className="rounded-xl border border-gold-500/30 bg-abyss-900/80 p-4 animate-in fade-in duration-200"
            >
              <h4 className="text-xs font-bold text-gold-300 mb-2">
                Agendar Visita Técnica
              </h4>
              <div className="space-y-3">
                <select
                  value={selectedAssemblerId}
                  onChange={(e) => setSelectedAssemblerId(e.target.value)}
                  className="w-full rounded-lg border border-steel-700 bg-abyss-950 p-2 text-xs text-steel-100 focus:border-gold-400 focus:outline-none cursor-pointer"
                >
                  <option value="">Selecione o montador...</option>
                  {assemblers.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
                <input
                  type="datetime-local"
                  value={selectedVisitDateTime}
                  onChange={(e) => setSelectedVisitDateTime(e.target.value)}
                  className="w-full rounded-lg border border-steel-700 bg-abyss-950 p-2 text-xs text-steel-100 focus:border-gold-400 focus:outline-none"
                />
                {ticket.technicalVisit?.status && (
                  <p className="text-[11px] text-steel-400">
                    Status atual:{" "}
                    <span className="font-semibold text-gold-300">
                      {
                        VISIT_STATUS_LABELS[
                          ticket.technicalVisit
                            .status as keyof typeof VISIT_STATUS_LABELS
                        ]
                      }
                    </span>
                  </p>
                )}
                <div className="flex justify-end gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsSchedulingVisit(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    disabled={
                      isSubmitting ||
                      !selectedAssemblerId ||
                      !selectedVisitDateTime
                    }
                    onClick={async () => {
                      try {
                        setIsSubmitting(true);
                        await ticketsService.scheduleVisit(
                          ticket.id,
                          selectedAssemblerId,
                          new Date(selectedVisitDateTime).toISOString(),
                        );
                        setIsSchedulingVisit(false);
                        onTriggerAction?.("TECH_VISIT_SCHEDULED", ticket.id);
                        onRefreshTicket?.();
                      } catch (err) {
                        console.error("Erro ao agendar visita:", err);
                      } finally {
                        setIsSubmitting(false);
                      }
                    }}
                  >
                    {isSubmitting ? "Agendando..." : "Confirmar Agendamento"}
                  </Button>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <footer className="flex items-center gap-2 border-t border-steel-700/40 p-4">
          <Button
            variant="secondary"
            className="flex-1 cursor-pointer text-xs"
            onClick={() => {
              resetPanels();
              setIsCommenting(!isCommenting);
            }}
          >
            <MessageSquare className="h-4 w-4" />
            Comentar
          </Button>

          <Button
            variant="secondary"
            className="flex-1 cursor-pointer text-xs"
            disabled={exportingPdf}
            onClick={async () => {
              try {
                setExportingPdf(true);
                const blob = await ticketsService.exportDossierPdf(ticket.id);
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `dossie-${ticket.code || ticket.id}.pdf`;
                a.click();
                URL.revokeObjectURL(url);
              } catch (err) {
                console.error("Erro ao exportar dossiê:", err);
              } finally {
                setExportingPdf(false);
              }
            }}
          >
            {exportingPdf ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            Dossiê PDF
          </Button>

          <Button
            className="flex-1 cursor-pointer text-xs"
            onClick={() => {
              resetPanels();
              setIsChangingStatus(!isChangingStatus);
            }}
          >
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Mudar Status <ChevronDown className="h-3 w-3 ml-1" />
          </Button>
        </footer>
      </aside>
    </>
  );
}

function topLabel(t: Ticket) {
  const scores = t.scores ?? { transporte: 33, fabrica: 33, montagem: 34 };
  const arr = [
    { k: "TRANSPORTE", v: scores.transporte ?? 0 },
    { k: "FABRICA", v: scores.fabrica ?? 0 },
    { k: "MONTAGEM", v: scores.montagem ?? 0 },
  ].sort((a, b) => b.v - a.v);

  const labels = {
    TRANSPORTE: "Avaria no Transporte",
    FABRICA: "Defeito de Fábrica",
    MONTAGEM: "Erro de Montagem",
  } as const;

  return labels[arr[0].k as keyof typeof labels] ?? "Avaria no Transporte";
}

function ActionCard({
  icon,
  label,
  tone,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  tone: "warning" | "danger" | "info";
  onClick?: () => void;
}) {
  const tones = {
    warning:
      "border-amber-500/30 bg-amber-500/5 text-amber-200 hover:bg-amber-500/15",
    danger: "border-red-500/30 bg-red-500/5 text-red-200 hover:bg-red-500/15",
    info: "border-sky-500/30 bg-sky-500/5 text-sky-200 hover:bg-sky-500/15",
  } as const;

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg border px-3 py-3 text-left text-xs font-semibold transition-colors cursor-pointer ${tones[tone]}`}
    >
      {icon}
      <span className="leading-snug">{label}</span>
    </button>
  );
}

function TimelineItem({
  when,
  who,
  desc,
  current,
}: {
  when: string;
  who: string;
  desc: string;
  current?: boolean;
}) {
  return (
    <li className="relative">
      <span
        className={`absolute -left-[21px] top-1.5 h-3 w-3 rounded-full border-2 border-abyss-950 ${
          current ? "bg-gold-400" : "bg-steel-500"
        }`}
      />
      <p className="text-[10px] font-bold uppercase tracking-widest text-steel-500">
        {when} • {who}
      </p>
      <p className="mt-0.5 text-sm text-steel-200">{desc}</p>
    </li>
  );
}
