import { useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Headphones,
  LifeBuoy,
  Mail,
  MessageCircle,
  Phone,
  Search,
  Send,
  Shield,
} from "lucide-react";
import { PageHeader } from "../ui/PageHeader";
import { Stat } from "../ui/Stat";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { EmptyState } from "../ui/EmptyState";
import { cn } from "../../utils/cn";

const FAQS = [
  {
    q: "Como reabrir um ticket já resolvido?",
    a: "Abra o drawer do ticket na Tabela Tática, clique em “Reabrir” e informe o motivo. O SLA reinicia com prioridade ALTA automaticamente.",
  },
  {
    q: "O que significa o Triage Score?",
    a: "É a probabilidade estimada pela IA de visão + regras de negócio de que a responsabilidade seja Transporte, Fábrica ou Montagem. A soma sempre fecha 100%.",
  },
  {
    q: "Como integrar uma nova fábrica no SAP/TOTVS?",
    a: "Em Configurações → Integrações, adicione o CNPJ e o endpoint EDI. Após o handshake, lotes e Danfes passam a sincronizar em até 15 minutos.",
  },
  {
    q: "O PWA do montador funciona offline?",
    a: "Sim. Evidências e mapeamentos ficam em fila local e sincronizam quando houver rede estável. O protocolo é gerado na nuvem após o sync.",
  },
  {
    q: "Como acionar um recall de lote?",
    a: "Em Peças & Lotes, filtre por código, abra o lote e use “Iniciar recall”. Todos os tickets vinculados recebem alerta e o lote é bloqueado para expedição.",
  },
];

const CANAIS = [
  {
    id: "chat",
    icon: MessageCircle,
    title: "Chat ao vivo",
    desc: "Resposta média em 4 min",
    status: "Online",
    tone: "success" as const,
  },
  {
    id: "tel",
    icon: Phone,
    title: "Plantão técnico",
    desc: "0800 744 0101",
    status: "24/7",
    tone: "gold" as const,
  },
  {
    id: "email",
    icon: Mail,
    title: "E-mail prioritário",
    desc: "suporte@fvfcheck.com.br",
    status: "SLA 2h",
    tone: "info" as const,
  },
];

const CHAMADOS = [
  {
    id: "SUP-4821",
    assunto: "Sincronização Danfe TOTVS falhando",
    status: "Em andamento",
    prioridade: "Alta",
    aberto: "hoje, 09:12",
  },
  {
    id: "SUP-4799",
    assunto: "Dúvida sobre score de montagem",
    status: "Aguardando você",
    prioridade: "Média",
    aberto: "ontem",
  },
  {
    id: "SUP-4750",
    assunto: "Treinamento equipe Campinas",
    status: "Resolvido",
    prioridade: "Baixa",
    aberto: "12/10",
  },
];

export function SuportePage() {
  const [faqOpen, setFaqOpen] = useState<number | null>(0);
  const [mensagem, setMensagem] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [faqQuery, setFaqQuery] = useState("");

  const faqs = FAQS.filter(
    (f) =>
      !faqQuery.trim() ||
      f.q.toLowerCase().includes(faqQuery.toLowerCase()) ||
      f.a.toLowerCase().includes(faqQuery.toLowerCase()),
  );

  function enviar() {
    if (!mensagem.trim()) return;
    setEnviado(true);
    setMensagem("");
    setTimeout(() => setEnviado(false), 4000);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        kicker="FVF CHECK • Helpdesk"
        title={
          <>
            Suporte <span className="text-gold-gradient">24/7</span>
          </>
        }
        description="Central de ajuda para gestores, triagem e montadores. Chat, plantão técnico e base de conhecimento do setor moveleiro."
        actions={
          <Badge variant="success">
            <span className="h-1.5 w-1.5 rounded-full bg-current pulse-dot" />
            Equipe online
          </Badge>
        }
      />

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat
          label="Tempo médio resposta"
          value="4 min"
          hint="Chat prioritário"
          icon={<Clock className="h-5 w-5" />}
          tone="gold"
        />
        <Stat
          label="CSAT suporte"
          value="96%"
          hint="Últimos 30 dias"
          icon={<CheckCircle2 className="h-5 w-5" />}
          tone="info"
        />
        <Stat
          label="Chamados abertos"
          value="2"
          hint="1 aguardando você"
          icon={<LifeBuoy className="h-5 w-5" />}
        />
        <Stat
          label="Uptime plataforma"
          value="99,97%"
          hint="SLA contratual"
          icon={<Shield className="h-5 w-5" />}
          tone="default"
        />
      </section>

      {/* Canais */}
      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {CANAIS.map((c) => {
          const Icon = c.icon;
          return (
            <button
              key={c.id}
              type="button"
              className="rounded-xl border border-steel-700/60 bg-gradient-to-b from-abyss-800/80 to-abyss-900/80 p-5 text-left transition-all hover:border-gold-500/40 hover:glow-gold"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-gold-500/30 bg-gold-500/10 text-gold-300">
                  <Icon className="h-5 w-5" />
                </div>
                <Badge variant={c.tone}>{c.status}</Badge>
              </div>
              <h3 className="mt-3 font-bold text-steel-50">{c.title}</h3>
              <p className="mt-1 text-sm text-steel-400">{c.desc}</p>
            </button>
          );
        })}
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        {/* Form + chamados */}
        <div className="space-y-4 xl:col-span-3">
          <section className="rounded-xl border border-steel-700/60 bg-gradient-to-b from-abyss-800/70 to-abyss-900/70 p-5">
            <div className="flex items-center gap-2">
              <Headphones className="h-4 w-4 text-gold-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-steel-50">
                Abrir chamado
              </h2>
            </div>
            <p className="mt-1 text-xs text-steel-400">
              Descreva o problema com ticket, lote ou Danfe quando possível.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Assunto">
                <input
                  className={inputCls}
                  placeholder="Ex.: RMA não sincroniza com fábrica"
                />
              </Field>
              <Field label="Prioridade">
                <select className={inputCls} defaultValue="media">
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                  <option value="critica">Crítica — operação parada</option>
                </select>
              </Field>
            </div>
            <Field label="Mensagem" className="mt-3">
              <textarea
                rows={4}
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                className={cn(inputCls, "resize-none")}
                placeholder="Detalhe o cenário, print e impacto no fluxo de triagem…"
              />
            </Field>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button onClick={enviar}>
                <Send className="h-4 w-4" />
                Enviar ao plantão
              </Button>
              {enviado && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" />
                  Chamado SUP-4822 aberto com sucesso
                </span>
              )}
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-steel-700/60 bg-abyss-950/40">
            <div className="border-b border-steel-700/40 px-4 py-3">
              <h2 className="text-sm font-bold text-steel-50">Meus chamados recentes</h2>
            </div>
            <ul className="divide-y divide-steel-700/40">
              {CHAMADOS.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-abyss-800/30"
                >
                  <div>
                    <p className="font-mono text-[11px] font-bold text-gold-400">{c.id}</p>
                    <p className="text-sm font-semibold text-steel-100">{c.assunto}</p>
                    <p className="text-[11px] text-steel-500">Aberto {c.aberto}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        c.prioridade === "Alta"
                          ? "warning"
                          : c.prioridade === "Baixa"
                            ? "muted"
                            : "info"
                      }
                    >
                      {c.prioridade}
                    </Badge>
                    <Badge
                      variant={
                        c.status === "Resolvido"
                          ? "success"
                          : c.status === "Aguardando você"
                            ? "gold"
                            : "default"
                      }
                    >
                      {c.status}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* FAQ */}
        <section className="rounded-xl border border-steel-700/60 bg-gradient-to-b from-abyss-800/70 to-abyss-900/70 p-5 xl:col-span-2">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-gold-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-steel-50">
              Base de conhecimento
            </h2>
          </div>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel-400" />
            <input
              value={faqQuery}
              onChange={(e) => setFaqQuery(e.target.value)}
              placeholder="Buscar na FAQ…"
              className={cn(inputCls, "pl-9")}
            />
          </div>

          <div className="mt-4 space-y-2">
            {faqs.length === 0 ? (
              <EmptyState
                title="Sem resultados"
                description="Tente outros termos ou abra um chamado."
                className="p-6"
              />
            ) : (
              faqs.map((f, i) => {
                const open = faqOpen === i;
                return (
                  <div
                    key={f.q}
                    className="rounded-lg border border-steel-700/50 bg-abyss-950/40"
                  >
                    <button
                      type="button"
                      onClick={() => setFaqOpen(open ? null : i)}
                      className="flex w-full items-center justify-between gap-2 px-3 py-3 text-left text-sm font-semibold text-steel-100"
                    >
                      {f.q}
                      <span className="text-gold-400">{open ? "−" : "+"}</span>
                    </button>
                    {open && (
                      <p className="border-t border-steel-700/40 px-3 py-3 text-xs leading-relaxed text-steel-400">
                        {f.a}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

const inputCls =
  "h-10 w-full rounded-lg border border-steel-700/60 bg-abyss-900/60 px-3 text-sm text-steel-100 placeholder:text-steel-500 focus:border-gold-500/60 focus:outline-none focus:ring-2 focus:ring-gold-400/20";

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-steel-400">
        {label}
      </span>
      {children}
    </label>
  );
}
