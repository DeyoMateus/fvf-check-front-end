import { useState, useEffect, useRef } from "react";
import {
  Bell,
  Search,
  ScanLine,
  ChevronDown,
  Plus,
  LogOut,
  X,
  CheckCheck,
  AlertTriangle,
  Clock,
  Inbox,
} from "lucide-react";
import { Button } from "../ui/Button";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../lib/api"; // Instância do Axios / Fetch do seu projeto

interface TopbarProps {
  onScanDanfe?: () => void;
  onNewTicket?: () => void;
  onSearch?: (query: string) => void;
}

export interface RealNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: "delay" | "new_ticket" | "urgent";
  read: boolean;
}

export function Topbar({ onScanDanfe, onNewTicket, onSearch }: TopbarProps) {
  const { user, logout } = useAuth();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState<RealNotification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // 🔔 1. Busca Notificações Reais no Backend
  async function fetchRealNotifications() {
    try {
      setLoadingNotifications(true);
      // Busca os tickets para gerar os alertas operacionais
      const response = await api.get("/tickets");
      const tickets = response.data || [];

      const generatedNotifications: RealNotification[] = [];

      tickets.forEach((ticket: any) => {
        // Alerta de SLA estourado / Atrasado
        if (ticket.slaHours !== undefined && ticket.slaHours <= 0 && ticket.status !== "COMPLETED") {
          generatedNotifications.push({
            id: `delay-${ticket.id}`,
            title: "Ticket em Atraso (SLA Excedido)",
            message: `O chamado ${ticket.code || ticket.id} ultrapassou o tempo limite de atendimento.`,
            time: "Urgente",
            type: "delay",
            read: false,
          });
        }

        // Alerta de Novo Ticket (Criado nas últimas 24h)
        const createdAt = new Date(ticket.createdAt || ticket.abertoEm);
        const diffHours = Math.abs(new Date().getTime() - createdAt.getTime()) / 36e5;

        if (diffHours <= 24 && ticket.status === "OPEN") {
          generatedNotifications.push({
            id: `new-${ticket.id}`,
            title: "Novo Ticket Registrado",
            message: `Novo chamado registrado para o cliente ${ticket.customerName || ticket.cliente || "Cliente"}.`,
            time: `${Math.round(diffHours)}h atrás`,
            type: "new_ticket",
            read: false,
          });
        }
      });

      setNotifications(generatedNotifications);
    } catch (error) {
      console.error("Erro ao carregar notificações do sistema:", error);
    } finally {
      setLoadingNotifications(false);
    }
  }

  useEffect(() => {
    fetchRealNotifications();
  }, []);

  // 🖱️ 2. Fechar painéis ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ⌨️ 3. Atalho ⌘K / Ctrl+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "US";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-steel-700/40 bg-abyss-950/70 px-4 backdrop-blur-md md:px-6">
      {/* Campo de Busca */}
      <div className="relative hidden flex-1 max-w-xl md:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel-400" />
        <input
          ref={searchInputRef}
          type="search"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (onSearch) onSearch(e.target.value);
          }}
          placeholder="Buscar por ticket, cliente, NF-e ou lote..."
          className="h-10 w-full rounded-lg border border-steel-700/60 bg-abyss-900/60 pl-9 pr-10 text-sm text-steel-100 placeholder:text-steel-500 focus:border-gold-500/60 focus:outline-none focus:ring-2 focus:ring-gold-400/20"
        />
        {searchQuery ? (
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              if (onSearch) onSearch("");
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-steel-400 hover:text-steel-100"
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <kbd className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border border-steel-700 bg-abyss-800 px-1.5 py-0.5 text-[10px] font-mono text-steel-400 md:block">
            ⌘ K
          </kbd>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Botão Escanear Danfe */}
        <Button
          variant="secondary"
          size="md"
          onClick={onScanDanfe}
          className="hidden sm:inline-flex"
        >
          <ScanLine className="h-4 w-4 text-gold-300" />
          Escanear Danfe
        </Button>

        {/* Botão Novo Ticket */}
        <Button onClick={onNewTicket} className="hidden sm:inline-flex">
          <Plus className="h-4 w-4" />
          Novo Ticket
        </Button>

        {/* Notificações Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            aria-label="Notificações"
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              setDropdownOpen(false);
            }}
            className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-steel-700/60 bg-abyss-900/60 text-steel-200 hover:border-gold-500/40 hover:text-gold-300"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-gold-400 animate-pulse" />
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-steel-700/60 bg-abyss-900 p-4 shadow-2xl backdrop-blur-md z-50">
              {/* Header do Menu com Botão de Fechar */}
              <div className="flex items-center justify-between border-b border-steel-800 pb-2 mb-3">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-steel-100 uppercase tracking-wider">
                    Notificações Operacionais
                  </h4>
                  {unreadCount > 0 && (
                    <span className="rounded bg-gold-500/20 px-1.5 py-0.5 text-[10px] font-bold text-gold-400">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setNotificationsOpen(false)}
                  className="rounded p-1 text-steel-400 hover:bg-steel-800 hover:text-steel-100 transition-colors"
                  title="Fechar Notificações"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Lista Notificações */}
              <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                {loadingNotifications ? (
                  <p className="text-center text-xs text-steel-400 py-4">
                    Atualizando alertas...
                  </p>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-6 text-steel-400">
                    <Inbox className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-xs">Nenhum alerta ou pendência pendente.</p>
                  </div>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-start gap-3 rounded-lg p-2.5 transition-colors ${
                        item.type === "delay"
                          ? "bg-red-500/10 border border-red-500/30 text-red-200"
                          : "bg-abyss-800/80 border border-steel-700/40 text-steel-200"
                      }`}
                    >
                      {item.type === "delay" ? (
                        <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                      ) : (
                        <Clock className="h-4 w-4 text-gold-400 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-steel-100">
                          {item.title}
                        </p>
                        <p className="text-[11px] leading-tight text-steel-300 mt-0.5">
                          {item.message}
                        </p>
                        <span className="text-[9px] text-steel-400 block mt-1">
                          {item.time}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setDropdownOpen(!dropdownOpen);
              setNotificationsOpen(false);
            }}
            className="flex items-center gap-2 rounded-lg border border-steel-700/60 bg-abyss-900/60 p-1 pr-3 hover:border-gold-500/40"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-gold-400 to-gold-600 font-bold text-abyss-950">
              {userInitials}
            </div>
            <div className="hidden text-left md:block">
              <p className="text-xs font-semibold text-steel-100">
                {user?.name || "Usuário"}
              </p>
              <p className="text-[10px] text-steel-400">{user?.role || "Operador"}</p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-steel-400" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl border border-steel-700/60 bg-abyss-900 p-1.5 shadow-2xl backdrop-blur-md z-50">
              <button
                type="button"
                onClick={() => {
                  setDropdownOpen(false);
                  logout();
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-red-400 hover:bg-red-500/10"
              >
                <LogOut className="h-3.5 w-3.5" />
                Encerrar Sessão
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}