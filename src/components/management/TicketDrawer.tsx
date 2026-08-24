import { useEffect, type ReactNode } from "react";
import { X, MessageSquare, Paperclip, Camera, Truck, Factory, Wrench } from "lucide-react";
import type { Ticket } from "../../lib/types";
import { TriageScoreMeter } from "../domain/TriageScoreMeter";
import { SeverityBadge } from "../domain/SeverityBadge";
import { SlaIndicator } from "../domain/SlaIndicator";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";

interface TicketDrawerProps {
  ticket: Ticket | null;
  onClose: () => void;
}

export function TicketDrawer({ ticket, onClose }: TicketDrawerProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!ticket) return null;

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
            <p className="font-mono text-xs font-bold text-gold-400">{ticket.id}</p>
            <h2 className="mt-1 text-lg font-semibold text-steel-50">{ticket.cliente}</h2>
            <p className="text-xs text-steel-400">{ticket.cidade}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <SeverityBadge value={ticket.severidade} />
              <SlaIndicator hours={ticket.slaHoras} />
              <Badge variant="outline">{ticket.danfe}</Badge>
              <Badge variant="muted">{ticket.lote}</Badge>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-steel-700/60 text-steel-300 hover:bg-abyss-800/60"
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
                com base em evidências fotográficas, padrão do lote e histórico do
                montador.
              </p>
            </div>
          </section>

          {/* Peças */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gold-400 hud-line-left">
              Peças Averiadas ({ticket.pecas.length})
            </h3>
            <ul className="mt-4 space-y-3">
              {ticket.pecas.map((p) => (
                <li
                  key={p.id}
                  className="rounded-xl border border-steel-700/50 bg-abyss-900/60 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-steel-100">{p.descricao}</p>
                      <p className="mt-0.5 text-[11px] text-steel-400">{p.material}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-steel-500">
                        Score
                      </p>
                      <p className="font-mono text-lg font-bold text-gold-300">
                        {p.score}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-steel-700/40 pt-3 text-[11px] text-steel-400">
                    <span className="inline-flex items-center gap-1.5">
                      <Camera className="h-3 w-3" />
                      {p.evidencia} foto{p.evidencia !== 1 && "s"}
                    </span>
                    <button className="font-semibold text-gold-300 hover:underline">
                      Ver evidência →
                    </button>
                  </div>
                </li>
              ))}
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
              />
              <ActionCard
                icon={<Factory className="h-4 w-4" />}
                label="Solicitar RMA à fábrica"
                tone="danger"
              />
              <ActionCard
                icon={<Wrench className="h-4 w-4" />}
                label="Agendar visita técnica"
                tone="info"
              />
            </div>
          </section>

          {/* Histórico */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gold-400 hud-line-left">
              Histórico
            </h3>
            <ol className="mt-4 space-y-3 border-l-2 border-gold-500/20 pl-4">
              <TimelineItem when="há 2h" who="Sistema" desc="Danfe lido e ticket criado." />
              <TimelineItem
                when="há 1h"
                who="IA de Visão"
                desc={`Detectou padrão compatível com ${topLabel(ticket).toLowerCase()}.`}
              />
              <TimelineItem
                when="agora"
                who="Carlos Drumond"
                desc="Iniciou triagem manual."
                current
              />
            </ol>
          </section>
        </div>

        {/* Footer */}
        <footer className="flex items-center gap-2 border-t border-steel-700/40 p-4">
          <Button variant="secondary" className="flex-1">
            <MessageSquare className="h-4 w-4" />
            Comentar
          </Button>
          <Button variant="secondary" className="flex-1">
            <Paperclip className="h-4 w-4" />
            Anexar Danfe
          </Button>
          <Button className="flex-1">Avançar Status</Button>
        </footer>
      </aside>
    </>
  );
}

function topLabel(t: Ticket) {
  const arr = [
    { k: "TRANSPORTE", v: t.scores.transporte },
    { k: "FABRICA", v: t.scores.fabrica },
    { k: "MONTAGEM", v: t.scores.montagem },
  ].sort((a, b) => b.v - a.v);
  return (
    {
      TRANSPORTE: "Avaria no Transporte",
      FABRICA: "Defeito de Fábrica",
      MONTAGEM: "Erro de Montagem",
    } as const
  )[arr[0].k as "TRANSPORTE" | "FABRICA" | "MONTAGEM"];
}

function ActionCard({
  icon,
  label,
  tone,
}: {
  icon: ReactNode;
  label: string;
  tone: "warning" | "danger" | "info";
}) {
  const tones = {
    warning:
      "border-amber-500/30 bg-amber-500/5 text-amber-200 hover:bg-amber-500/15",
    danger: "border-red-500/30 bg-red-500/5 text-red-200 hover:bg-red-500/15",
    info: "border-sky-500/30 bg-sky-500/5 text-sky-200 hover:bg-sky-500/15",
  } as const;
  return (
    <button
      className={`flex items-center gap-2 rounded-lg border px-3 py-3 text-left text-xs font-semibold transition-colors ${tones[tone]}`}
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
