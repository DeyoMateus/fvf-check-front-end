import { useEffect, useState, useCallback, useMemo } from "react";
import { ImageViewerProvider } from "./contexts/ImageViewerContext";
import { MeusChamadosView } from "./components/assembler/MeusChamadosView";
import { IosInstallBanner } from "./components/pwa/IosInstallBanner";
import { LixeiraPage } from "./components/pages/LixeiraPage";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Inbox,
  Smartphone,
  Monitor,
  Truck,
  ShieldAlert,
  Wrench,
} from "lucide-react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { LoginPage } from "./components/pages/LoginPage";
import { Sidebar } from "./components/layout/Sidebar";
import { Topbar } from "./components/layout/Topbar";
import { TicketKanbanBoard } from "./components/management/TicketKanbanBoard";
import { TicketTable } from "./components/management/TicketTable";
import { TicketDrawer } from "./components/management/TicketDrawer";
import { CreateTicketModal } from "./components/management/CreateTicketModal";
import { Stat } from "./components/ui/Stat";
import { Badge } from "./components/ui/Badge";
import { Tabs } from "./components/ui/Tabs";
import { PageHeader } from "./components/ui/PageHeader";
import { ticketsService } from "./services/tickets.service";
import { AssemblerScannerView } from "./components/assembler/EvidenciaGallery";
import { FabricasPage } from "./components/pages/FabricasPage";
import { PecasLotesPage } from "./components/pages/PecasLotesPage";
import { MontadoresPage } from "./components/pages/MontadoresPage";
import { RelatoriosPage } from "./components/pages/RelatoriosPage";
import { ConfiguracoesPage } from "./components/pages/ConfiguracoesPage";
import { Ticket, TicketStatus } from "./lib/types";
import { cn } from "./utils/cn";
import { TicketsPage } from "./components/pages/TicketsPage";
import { toast } from 'sonner';


type Mode = "painel" | "pwa";
type PageId =
  | "kanban"
  | "tabela"
  | "fabricas"
  | "pecas"
  | "montadores"
  | "relatorios"
  | "suporte"
  | "config"
  | "tickets"
  | "lixeira";

/* ========== COMPONENTE DE GUARD DE AUTENTICAÇÃO ========== */

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const buildTarget = import.meta.env.MODE === "pwa" ? "pwa" : "painel";
  const [mode, setMode] = useState<Mode>(buildTarget);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-abyss-950 text-gold-400">
        <p className="animate-pulse font-semibold text-xs tracking-widest uppercase">
          Carregando protocolo FVF CHECK...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-abyss-950 text-steel-100">
      
       {/* O seletor manual só aparece em ambiente de desenvolvimento
          (npm run dev, sem --mode pwa) — útil pra visualizar as duas
          telas durante o trabalho de design, mas nunca em produção,
          onde cada build já sabe qual experiência mostrar. */}
      {import.meta.env.DEV && <ModeSwitcher mode={mode} onChange={setMode} />}

      {mode === "painel" ? <PainelGestao /> : <PwaPreview />}
    </div>
  );
}

/* ========== ROOT APP (COM AUTH PROVIDER) ========== */

export default function App() {
  return (
    <ImageViewerProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ImageViewerProvider>
  );
}

/* ========== SELETOR DE MODO (DEMO) ========== */

function ModeSwitcher({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
      <div className="rounded-full border border-gold-500/40 bg-abyss-950/90 p-1 shadow-2xl backdrop-blur glow-gold">
        <Tabs<Mode>
          value={mode}
          onChange={onChange}
          options={[
            {
              value: "painel",
              label: "Painel Web",
              icon: <Monitor className="h-3.5 w-3.5" />,
            },
            {
              value: "pwa",
              label: "PWA Montador",
              icon: <Smartphone className="h-3.5 w-3.5" />,
            },
          ]}
        />
      </div>
    </div>
  );
}

/* ========== PAINEL DE GESTÃO ========== */

function PainelGestao() {
  const [active, setActive] = useState<PageId>("kanban");
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

    const visibleTickets = useMemo(() => {
    if (!searchQuery.trim()) return tickets;
    const q = searchQuery.trim().toLowerCase();
    return tickets.filter(
      (t) =>
        t.code?.toLowerCase().includes(q) ||
        t.customerName?.toLowerCase().includes(q) ||
        t.nfeKey?.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q),
    );
  }, [tickets, searchQuery]);

  useEffect(() => {
    if (selected) {
      const updatedCurrent = tickets.find((t) => t.id === selected.id);
      if (updatedCurrent && JSON.stringify(updatedCurrent) !== JSON.stringify(selected)) {
        setSelected(updatedCurrent);
      }
    }
  }, [tickets, selected]);

  const loadTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await ticketsService.getAll();
      if (Array.isArray(data)) {
        setTickets(data);
      } else {
        setTickets([]);
      }
    } catch (error) {
      console.error("Erro ao carregar tickets:", error);
      setTickets([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  // Função central para alterar status usada tanto pelo Drawer quanto pelo Kanban (Drag & Drop)
  const handleStatusChange = useCallback(async (ticketId: string, newStatus: TicketStatus) => {
    const typedStatus = newStatus as TicketStatus;

    // 1. Atualização Otimista
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: typedStatus } : t))
    );

    setSelected((prev: Ticket | null) =>
      prev && prev.id === ticketId ? { ...prev, status: typedStatus } : prev
    );

    // 2. Persistência na API
    try {
      await ticketsService.updateStatus(ticketId, typedStatus);
      toast.success("Status atualizado com sucesso!", {
        position: "top-center",
        style: {
          fontSize: "16px",
          fontWeight: "600",
          padding: "16px 28px",
          borderRadius: "12px",
        },
      });
    } catch (err) {
      toast.error("Erro ao sincronizar status com o servidor.", {
        position: "top-center",
      });
    }
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar active={active} onChange={(id) => setActive(id as PageId)} />
      
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
         onNewTicket={() => setIsCreateModalOpen(true)}
         onSearch={setSearchQuery}
         onScanDanfe={(scannedValue) => {
           setSearchQuery(scannedValue);
           // Garante que o resultado do scan seja visível mesmo se o
           // usuário estava numa página que não lista tickets (ex: Fábricas)
           if (active !== "kanban" && active !== "tabela" && active !== "tickets") {
             setActive("kanban");
           }
         }}
       />

        <main className="flex-1 overflow-y-auto p-4 pb-24 md:p-6 md:pb-24">
          {active === "kanban" && (
            <TriagemPage
              view="kanban"
              onViewChange={(v) => setActive(v)}
              onTicketClick={setSelected}
              tickets={visibleTickets}
              isLoading={isLoading}
              onStatusChange={handleStatusChange}
            />
          )}
          {active === "tabela" && (
            <TriagemPage
              view="tabela"
              onViewChange={(v) => setActive(v)}
              onTicketClick={setSelected}
              tickets={visibleTickets}
              isLoading={isLoading}
              onStatusChange={handleStatusChange}
            />
          )}
          {active === "fabricas" && <FabricasPage />}
          {active === "pecas" && <PecasLotesPage />}
          {active === "montadores" && <MontadoresPage />}
          {active === "relatorios" && <RelatoriosPage />}
          {active === "config" && <ConfiguracoesPage />}
           {active === "tickets" && <TicketsPage externalQuery={searchQuery} />}
          {active === "lixeira" && <LixeiraPage />}
        </main>
      </div>

      <TicketDrawer 
        key={selected ? `${selected.id}-${selected.status}` : 'drawer-closed'}
        ticket={selected} 
        onClose={() => setSelected(null)}
        onStatusChange={handleStatusChange}
        onAddComment={async (ticketId, comment) => {
          await ticketsService.addComment(ticketId, comment);
          loadTickets();
        }}
        onTriggerAction={async (actionType, ticketId) => {
          if (actionType === "TRANSPORTE_CLAIM") {
            await ticketsService.updateResponsibility(ticketId, "TRANSPORT_DAMAGE");
          } else if (actionType === "FACTORY_RMA") {
            await ticketsService.updateResponsibility(ticketId, "FACTORY_DEFECT");
          } else if (actionType === "TECH_VISIT_SCHEDULED") {
            
          }
          loadTickets();
        }}
      />

      <CreateTicketModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          loadTickets();
        }}
      />
    </div>
  );
}

/* ========== PÁGINA DE TRIAGEM (KANBAN / TABELA) ========== */

function TriagemPage({
  view,
  onViewChange,
  onTicketClick,
  tickets,
  isLoading,
  onStatusChange,
}: {
  view: "kanban" | "tabela";
  onViewChange: (v: "kanban" | "tabela") => void;
  onTicketClick: (t: Ticket) => void;
  tickets: Ticket[];
  isLoading: boolean;
  onStatusChange?: (ticketId: string, newStatus: TicketStatus) => Promise<void> | void;
}) {
  const safeTickets = Array.isArray(tickets) ? tickets : [];
  const total = safeTickets.length;
  
  const abertos = safeTickets.filter(
    (t) => t.status === "OPEN" || t.status === "UNDER_REVIEW"
  ).length;
  
  const criticos = safeTickets.filter((t) => t.severity === "CRITICAL").length;

  const hojeStr = new Date().toISOString().split("T")[0];

  const ticketsHoje = safeTickets.filter((t) => {
    if (!t.createdAt) return false;
    const dataTicket = new Date(t.createdAt).toISOString().split("T")[0];
    return dataTicket === hojeStr;
  });

  const resolvidosHoje = ticketsHoje.filter(
    (t) => t.status === "COMPLETED" || t.status === "APPROVED"
  ).length;

  const totalHoje = ticketsHoje.length;

  const taxaResolucaoHoje = totalHoje > 0 
    ? Math.round((resolvidosHoje / totalHoje) * 100) 
    : 0;

  const porResp = {
    transporte: safeTickets.filter((t) => t.suggestedResponsibility === "TRANSPORT_DAMAGE").length,
    fabrica: safeTickets.filter((t) => t.suggestedResponsibility === "FACTORY_DEFECT").length,
    montagem: safeTickets.filter((t) => t.suggestedResponsibility === "ASSEMBLY_ERROR").length,
  };

  return (
    <div className="space-y-5">
      <PageHeader
        kicker="FVF CHECK • Triagem"
        title={
          <>
            <span className="text-gold-gradient">Painel de Triagem</span> — Setor
            Moveleiro
          </>
        }
        description={
          <>
            Classifique automaticamente a responsabilidade entre{" "}
            <span className="font-semibold text-amber-300">Transporte</span>,{" "}
            <span className="font-semibold text-red-300">Fábrica</span> e{" "}
            <span className="font-semibold text-sky-300">Montagem</span> com base
            em evidências fotográficas, lote e histórico.
          </>
        }
      />

      <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat
          label="Tickets Abertos"
          value={abertos}
          hint={`${total} totais no mês`}
          icon={<Inbox className="h-5 w-5" />}
          tone="gold"
        />
        <Stat
          label="Críticos (SLA < 2h)"
          value={criticos}
          hint="Atenção imediata"
          icon={<AlertTriangle className="h-5 w-5" />}
          tone="danger"
        />
        <Stat
          label="Avaria Transporte"
          value={porResp.transporte}
          hint="Sinistro com transportadora"
          icon={<Truck className="h-5 w-5" />}
          tone="default"
        />
        <Stat
          label="Resolvidos Hoje"
          value={resolvidosHoje}
          hint={`De ${totalHoje} criados hoje`}
          icon={<CheckCircle2 className="h-5 w-5" />}
          tone="info"
        />
        <Stat
          label="Taxa de Resolução"
          value={`${taxaResolucaoHoje}%`}
          hint="Meta diária: 85%"
          icon={<CheckCircle2 className="h-5 w-5" />}
          tone={taxaResolucaoHoje >= 85 ? "gold" : "info"}
        />
      </section>

      <section className="rounded-xl border border-steel-700/40 bg-gradient-to-b from-abyss-800/60 to-abyss-900/60 p-4 md:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gold-400">
              Distribuição de Responsabilidade
            </p>
            <h2 className="mt-1 text-lg font-bold text-steel-50">
              Triage Score agregado — últimos 30 dias
            </h2>
          </div>
          <Badge variant="outline">Atualizado em tempo real</Badge>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <RespBar
            label="Avaria no Transporte"
            icon={<Truck className="h-4 w-4" />}
            value={porResp.transporte}
            total={total}
            color="#f59e0b"
          />
          <RespBar
            label="Defeito de Fábrica"
            icon={<ShieldAlert className="h-4 w-4" />}
            value={porResp.fabrica}
            total={total}
            color="#ef4444"
          />
          <RespBar
            label="Erro de Montagem"
            icon={<Wrench className="h-4 w-4" />}
            value={porResp.montagem}
            total={total}
            color="#38bdf8"
          />
        </div>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-base font-bold text-steel-50">
            <ClipboardList className="h-4 w-4 text-gold-400" />
            Triage Operacional
          </h2>
          <Tabs
            value={view}
            onChange={onViewChange}
            options={[
              { value: "kanban", label: "Kanban" },
              { value: "tabela", label: "Tabela Tática" },
            ]}
          />
        </div>

        {view === "kanban" ? (
          <TicketKanbanBoard
            key={tickets.map((t) => `${t.id}-${t.status}`).join("|")}
            tickets={safeTickets}
            isLoading={isLoading}
            onTicketClick={onTicketClick}
            onStatusChange={onStatusChange}
          />
        ) : (
          <TicketTable
            key={tickets.map((t) => `${t.id}-${t.status}`).join("|")}
            tickets={safeTickets}
            onTicketClick={onTicketClick}
          />
        )}
      </section>
    </div>
  );
}

function RespBar({
  label,
  icon,
  value,
  total,
  color,
}: {
  label: string;
  icon: React.ReactNode;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100);
  return (
    <div className="rounded-lg border border-steel-700/50 bg-abyss-950/50 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-steel-200">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-md"
            style={{ background: `${color}22`, color }}
          >
            {icon}
          </span>
          {label}
        </div>
        <span className="font-mono text-xs tabular-nums text-steel-300">
          {value}/{total}
        </span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-abyss-900">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-steel-500">
        {pct}% dos casos
      </p>
    </div>
  );
}

/* ========== PWA PREVIEW (FRAME DE CELULAR) ========== */

function PwaPreview() {

  const [tab, setTab] = useState<"novo" | "meus">("novo");

  return (
    <div className="flex min-h-screen items-start justify-center bg-[radial-gradient(circle_at_50%_0%,rgba(227,185,33,0.08),transparent_60%)] px-4 py-8 pb-28">
      <IosInstallBanner />
      <div className="w-full max-w-md">
        <div className="mb-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gold-400 hud-line">
            PWA • Modo Montador
          </p>
          <h1 className="mt-2 text-xl font-bold text-steel-50">
            Mapeamento rápido de defeitos
          </h1>
          <p className="mt-1 text-xs text-steel-400">
            Operação otimizada para uma mão só, no endereço do cliente.
          </p>
        </div>

         <div className="mx-auto mb-3 flex max-w-[400px] rounded-lg border border-steel-700/60 bg-abyss-900/60 p-1">
        <button
          onClick={() => setTab("novo")}
          className={cn(
            "flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors",
            tab === "novo" ? "bg-gold-500/15 text-gold-200" : "text-steel-400",
          )}
        >
          Novo Chamado
        </button>
        <button
          onClick={() => setTab("meus")}
          className={cn(
            "flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors",
            tab === "meus" ? "bg-gold-500/15 text-gold-200" : "text-steel-400",
          )}
        >
          Meus Chamados
        </button>
      </div>

        <div
          className={cn(
            "relative mx-auto w-full max-w-[400px] overflow-hidden rounded-[2.5rem] border-[10px] border-abyss-900",
            "shadow-[0_0_0_1px_rgba(227,185,33,0.3),0_30px_80px_-20px_rgba(0,0,0,0.7),0_0_60px_-15px_rgba(227,185,33,0.4)]",
          )}
        >
          <div className="absolute left-1/2 top-2 z-30 h-5 w-32 -translate-x-1/2 rounded-b-2xl bg-abyss-900" />
          <div className="relative h-[760px] overflow-y-auto bg-abyss-950">
            {tab === "novo" ? <AssemblerScannerView /> : <MeusChamadosView />}
          </div>
        </div>
      </div>
    </div>
  );
}