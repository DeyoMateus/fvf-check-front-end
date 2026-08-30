import { useEffect, useState, type ReactNode } from "react";
import { X, MessageSquare, Paperclip, Camera, Truck, Factory, Wrench, CheckCircle2, ChevronDown } from "lucide-react";
import type { Ticket, TicketPart, TicketStatus } from "../../lib/types";
import { TriageScoreMeter } from "../domain/TriageScoreMeter";
import { SeverityBadge } from "../domain/SeverityBadge";
import { SlaIndicator } from "../domain/SlaIndicator";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";


export interface TicketDrawerProps {
  ticket: Ticket | null;
  onClose: () => void;
  onStatusChange?: (ticketId: string, newStatus: TicketStatus) => Promise<void> | void;
  onAddComment?: (ticketId: string, comment: string) => Promise<void> | void;
  onTriggerAction?: (actionType: string, ticketId: string) => void;
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
    raw.partName || raw.descricao || raw.name || raw.title || `Peça (${partCode})`
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

  const evidenceCount = mediaList.length > 0 
    ? mediaList.length 
    : Number(raw.evidenceCount || raw.evidencia || 0);

  const defectType = String(raw.defectType || raw.defeito || raw.type || "Geral");

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
  onViewEvidence
}: TicketDrawerProps) {
  const [isCommenting, setIsCommenting] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [selectedNewStatus, setSelectedNewStatus] = useState<TicketStatus>(
  ticket?.status || "UNDER_REVIEW" );
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Adicione este efeito para manter o select sincronizado com a prop ticket:
useEffect(() => {
  if (ticket?.status) {
    setSelectedNewStatus(ticket.status);
  }
}, [ticket?.status]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!ticket) return null;

  const displayCode = ticket.code || ticket.id;
  const displayCustomer = ticket.customerName || "Cliente não informado";
  const displayCity = ticket.cityName || "Não especificada";
  const displayNfe = ticket.nfeKey ? `NF-e ${ticket.nfeKey.slice(0, 8)}...` : "Sem NF-e";
  const displayBatch = ticket.batchNumber ? `Lote ${ticket.batchNumber}` : "Sem lote";
  const partsList = ticket.parts ?? [];

 const handleConfirmStatusChange = async () => {
  if (!onStatusChange || !ticket) return;

  setIsSubmitting(true);
  try {
    await onStatusChange(ticket.id, selectedNewStatus);
    setIsChangingStatus(false);
    // Mantenha onClose() se quiser fechar a modal ao alterar, 
    // ou remova onClose() para deixá-la aberta mostrando o status atualizado em tempo real.
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
            <p className="font-mono text-xs font-bold text-gold-400">{displayCode}</p>
            <h2 className="mt-1 text-lg font-semibold text-steel-50">{displayCustomer}</h2>
            <p className="text-xs text-steel-400">{displayCity}</p>
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
                com base em evidências fotográficas, padrão do lote e histórico do montador.
              </p>
            </div>
          </section>

          {/* Seção para Alterar Status Manualmente */}
          {isChangingStatus && (
            <section className="rounded-xl border border-gold-500/30 bg-abyss-900/80 p-4 animate-in fade-in duration-200">
              <h4 className="text-xs font-bold text-gold-300 mb-2">Selecione o Novo Status do Ticket</h4>
              <div className="space-y-3">
                <select
                  value={selectedNewStatus}
                  onChange={(e) => setSelectedNewStatus(e.target.value as TicketStatus)}
                  className="w-full rounded-lg border border-steel-700 bg-abyss-950 p-2 text-xs text-steel-100 focus:border-gold-400 focus:outline-none cursor-pointer"
                >
                  {AVAILABLE_STATUSES.map((st) => (
                    <option key={st.value} value={st.value}>
                      {st.label} ({st.value})
                    </option>
                  ))}
                </select>
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setIsChangingStatus(false)}>
                    Cancelar
                  </Button>
                  <Button size="sm" onClick={handleConfirmStatusChange} disabled={isSubmitting}>
                    {isSubmitting ? "Atualizando..." : "Confirmar Alteração"}
                  </Button>
                </div>
              </div>
            </section>
          )}

          {/* Seção de Comentário Rápido */}
          {isCommenting && (
            <section className="rounded-xl border border-gold-500/30 bg-abyss-900/80 p-4 animate-in fade-in duration-200">
              <h4 className="text-xs font-bold text-gold-300 mb-2">Adicionar Nota de Auditoria</h4>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Digite detalhes da tratativa ou observação..."
                className="w-full rounded-lg border border-steel-700 bg-abyss-950 p-2 text-xs text-steel-100 focus:border-gold-400 focus:outline-none"
                rows={3}
              />
              <div className="mt-2 flex justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={() => setIsCommenting(false)}>
                  Cancelar
                </Button>
                <Button size="sm" onClick={handleSaveComment} disabled={isSubmitting}>
                  {isSubmitting ? "Salvando..." : "Salvar Nota"}
                </Button>
              </div>
            </section>
          )}

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
                        <p className="font-semibold text-steel-100">{part.partName}</p>
                        <p className="mt-0.5 text-[11px] text-steel-400">
                          Código: <span className="font-mono">{part.partCode}</span> | Defeito: {part.defectType}
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
                        {part.evidenceCount} foto{part.evidenceCount !== 1 && "s"}
                      </span>
                      <button 
                        onClick={() => onViewEvidence?.(p)}
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
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <ActionCard
                icon={<Truck className="h-4 w-4" />}
                label="Abrir sinistro c/ transportadora"
                tone="warning"
                onClick={() => onTriggerAction?.("TRANSPORTE_CLAIM", ticket.id)}
              />
              <ActionCard
                icon={<Factory className="h-4 w-4" />}
                label="Solicitar RMA à fábrica"
                tone="danger"
                onClick={() => onTriggerAction?.("FACTORY_RMA", ticket.id)}
              />
              <ActionCard
                icon={<Wrench className="h-4 w-4" />}
                label="Agendar visita técnica"
                tone="info"
                onClick={() => onTriggerAction?.("TECH_VISIT", ticket.id)}
              />
            </div>
          </section>

          {/* Histórico */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gold-400 hud-line-left">
              Histórico
            </h3>
            <ol className="mt-4 space-y-3 border-l-2 border-gold-500/20 pl-4">
              <TimelineItem when="há 2h" who="Sistema" desc="DANFE lido e ticket criado." />
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
            </ol>
          </section>
        </div>

        {/* Footer */}
        <footer className="flex items-center gap-2 border-t border-steel-700/40 p-4">
          <Button 
            variant="secondary" 
            className="flex-1 cursor-pointer text-xs"
            onClick={() => {
              setIsCommenting(!isCommenting);
              setIsChangingStatus(false);
            }}
          >
            <MessageSquare className="h-4 w-4" />
            Comentar
          </Button>
          <Button 
            variant="secondary" 
            className="flex-1 cursor-pointer text-xs"
            onClick={() => onTriggerAction?.("ATTACH_DANFE", ticket.id)}
          >
            <Paperclip className="h-4 w-4" />
            Anexar NF-e
          </Button>
          <Button 
            className="flex-1 cursor-pointer text-xs" 
            onClick={() => {
              setIsChangingStatus(!isChangingStatus);
              setIsCommenting(false);
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