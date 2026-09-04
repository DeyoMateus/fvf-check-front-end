import { useEffect, useMemo, useState } from "react";
import {
  Inbox,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Eye,
  Truck,
  Building2,
  Wrench,
  Filter,
} from "lucide-react";
import {
  ticketsService,
  STATUS_LABELS,
  RESPONSIBILITY_LABELS,
  type Ticket,
  type TicketStatus,
  type ResponsibilityLabel,
} from "../../services/tickets.service";
import { PageHeader } from "../ui/PageHeader";
import { Stat } from "../ui/Stat";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Tabs } from "../ui/Tabs";
import { SearchInput } from "../ui/SearchInput";
import { EmptyState } from "../ui/EmptyState";
import { CreateTicketModal } from "../management/CreateTicketModal";
import { TicketDetailsModal } from "../management/TicketDetailsModal";

type StatusTab = "ALL" | TicketStatus;

const STATUS_BADGES: Record<
  TicketStatus,
  { variant: "warning" | "success" | "danger" | "muted" | "info" }
> = {
  OPEN: { variant: "warning" },
  UNDER_REVIEW: { variant: "info" },
  APPROVED: { variant: "success" },
  REJECTED: { variant: "danger" },
  COMPLETED: { variant: "muted" },
  CANCELLED: { variant: "muted" },
};

const RESP_ICONS: Record<ResponsibilityLabel, typeof Truck> = {
  TRANSPORT_DAMAGE: Truck,
  FACTORY_DEFECT: Building2,
  ASSEMBLY_ERROR: Wrench,
};

interface TicketsPageProps {
  externalQuery?: string;
}

export function TicketsPage({ externalQuery }: TicketsPageProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<StatusTab>("ALL");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  async function fetchTickets() {
    try {
      setLoading(true);
      const data = await ticketsService.getAll();
      setTickets(data);
    } catch (err) {
      console.error("Erro ao carregar chamados:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTickets();
  }, []);

  // Sincroniza com a busca global do Topbar (texto digitado ou DANFE
  // escaneada). O usuário ainda pode digitar livremente no campo local
  // de busca desta página — a prop externa só atualiza o valor inicial
  // sempre que mudar (ex: um novo scan), sem travar a edição manual.
  useEffect(() => {
    if (externalQuery !== undefined) {
      setQuery(externalQuery);
    }
  }, [externalQuery]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (activeTab !== "ALL" && t.status !== activeTab) return false;
      if (!query.trim()) return true;

      const q = query.toLowerCase();
      return (
        t.code?.toLowerCase().includes(q) ||
        t.customerName?.toLowerCase().includes(q) ||
        t.nfeKey?.includes(q) ||
        t.id.toLowerCase().includes(q)
      );
    });
  }, [tickets, query, activeTab]);

  const emAnalise = tickets.filter(
    (t) => t.status === "OPEN" || t.status === "UNDER_REVIEW"
  ).length;
  const aprovados = tickets.filter((t) => t.status === "APPROVED").length;
  const rejeitados = tickets.filter((t) => t.status === "REJECTED").length;

  if (loading) {
    return (
      <div className="flex h-64 w-full items-center justify-center text-steel-400">
        <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        kicker="FVF CHECK • Operação"
        title={
          <>
            Gestão de <span className="text-gold-gradient">Tickets</span>
          </>
        }
        description="Fila de triagem operacional, controle de SLA e atribuição de responsabilidade técnica."
        actions={
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Novo Chamado
          </Button>
        }
      />

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat
          label="Total de Chamados"
          value={tickets.length}
          hint="Cadastrados na base"
          icon={<Inbox className="h-5 w-5" />}
        />
        <Stat
          label="Em Triagem / Análise"
          value={emAnalise}
          hint="Requer análise rápida"
          icon={<Clock className="h-5 w-5" />}
          tone="gold"
        />
        <Stat
          label="Aprovados"
          value={aprovados}
          hint="RMA em andamento"
          icon={<CheckCircle2 className="h-5 w-5" />}
          tone="info"
        />
        <Stat
          label="Rejeitados"
          value={rejeitados}
          hint="Improcedentes"
          icon={<XCircle className="h-5 w-5" />}
          tone="danger"
        />
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Buscar por código, cliente ou chave NF-e…"
          className="min-w-[240px] flex-1 max-w-md"
        />
        <Tabs<StatusTab>
          value={activeTab}
          onChange={setActiveTab}
          options={[
            { value: "ALL", label: "Todos", count: tickets.length },
            { value: "OPEN", label: "Abertos", count: tickets.filter((t) => t.status === "OPEN").length },
            { value: "UNDER_REVIEW", label: "Em Análise", count: tickets.filter((t) => t.status === "UNDER_REVIEW").length },
            { value: "APPROVED", label: "Aprovados", count: aprovados },
            { value: "REJECTED", label: "Rejeitados", count: rejeitados },
          ]}
        />
      </div>

      {filteredTickets.length === 0 ? (
        <EmptyState
          title="Nenhum chamado encontrado"
          description="Ajuste os filtros ou crie uma nova ocorrência de triagem."
          icon={<Filter className="h-7 w-7" />}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-steel-700/60 bg-abyss-950/40">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-abyss-900/80 text-[10px] uppercase tracking-[0.18em] text-steel-400">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Cód. Chamado</th>
                  <th className="px-4 py-3 text-left font-semibold">Cliente / Consumidor</th>
                  <th className="px-4 py-3 text-left font-semibold">Nota Fiscal</th>
                  <th className="px-4 py-3 text-left font-semibold">Responsabilidade</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Abertura</th>
                  <th className="px-4 py-3 text-right font-semibold">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-steel-700/40">
                {filteredTickets.map((t) => {
                  const resp = t.suggestedResponsibility;
                  const RespIcon = resp ? RESP_ICONS[resp] : null;

                  return (
                    <tr
                      key={t.id}
                      className="text-steel-200 transition-colors hover:bg-abyss-800/40"
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-bold text-gold-400">
                          #{t.code || t.id.slice(0, 6)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-steel-50">
                          {t.customerName || "Cliente não informado"}
                        </p>
                        <p className="text-[11px] text-steel-400">
                          {t.customerPhone || "Sem contato"}
                        </p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-steel-300">
                        {t.nfeKey ? `${t.nfeKey.slice(0, 12)}...` : "N/A"}
                      </td>
                      <td className="px-4 py-3">
                        {resp && RespIcon ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-steel-300">
                            <RespIcon className="h-3.5 w-3.5 text-gold-400" />
                            {RESPONSIBILITY_LABELS[resp]}
                          </span>
                        ) : (
                          <span className="text-xs text-steel-500 italic">Pendente</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_BADGES[t.status]?.variant || "muted"}>
                          {STATUS_LABELS[t.status] || t.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-steel-400">
                        {t.createdAt
                          ? new Date(t.createdAt).toLocaleDateString("pt-BR")
                          : "N/A"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedTicket(t)}
                          className="inline-flex items-center gap-1.5 rounded-md border border-gold-500/30 bg-gold-500/5 px-2.5 py-1 text-[11px] font-semibold text-gold-300 hover:bg-gold-500/15 transition-all"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Detalhes
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <CreateTicketModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          setIsCreateOpen(false);
          fetchTickets();
        }}
      />

      <TicketDetailsModal
        ticket={selectedTicket}
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        onRefresh={fetchTickets}
      />
    </div>
  );
}