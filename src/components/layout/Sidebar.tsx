import { LayoutDashboard, Inbox, Users, Factory, PackageSearch, BarChart3, Settings, LifeBuoy, Anchor, Menu, X, LogOut, Trash2 } from "lucide-react";

import { useState } from "react";
import { cn } from "../../utils/cn";
import { useAuth } from "../../contexts/AuthContext";

interface SidebarProps {
  active: string;
  onChange: (v: string) => void;
}

const NAV = [
  { id: "kanban", label: "Triagem", icon: LayoutDashboard },
  { id: "tabela", label: "Tabela Tática", icon: Inbox },
  { id: "tickets", label: "Gestão de Ticket", icon: LifeBuoy },
  { id: "fabricas", label: "Fábricas", icon: Factory },
  { id: "pecas", label: "Peças & Lotes", icon: PackageSearch },
  { id: "montadores", label: "Montadores", icon: Users },
  { id: "relatorios", label: "Relatórios", icon: BarChart3 },
];

const FOOT = [
  { id: "config", label: "Configurações", icon: Settings },
];

export function Sidebar({ active, onChange }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();

  const canSeeTrash = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  function navigate(id: string) {
    onChange(id);
    setMobileOpen(false);
  }

  return (
    <>
      {/* Botão flutuante mobile */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed bottom-20 left-4 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-gold-500/40 bg-abyss-900 text-gold-300 shadow-xl glow-gold md:hidden"
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Overlay mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-abyss-950/70 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-screen w-64 shrink-0 flex-col border-r border-steel-700/40 bg-abyss-950/95 backdrop-blur transition-transform duration-200 md:static md:z-0 md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        {/* Brand */}
        <div className="flex items-center justify-between gap-3 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-gold-500/40 bg-gradient-to-br from-abyss-700 to-abyss-900 glow-gold">
              <Anchor className="h-5 w-5 text-gold-300" />
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-gold-400 pulse-dot" />
            </div>
            <div>
              <p className="font-bold tracking-[0.18em] text-steel-50">
                FVF CHECK
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gold-400">
                Painel de Gestão
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-steel-700/60 text-steel-300 md:hidden"
            aria-label="Fechar menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-gold-500/40 to-transparent" />

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.22em] text-steel-500">
            Operacional
          </p>
          {NAV.map((n) => {
            const Icon = n.icon;
            const isActive = active === n.id;
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => navigate(n.id)}
                className={cn(
                  "group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-all",
                  isActive
                    ? "bg-gold-500/10 text-gold-200 shadow-[inset_0_0_0_1px_rgba(227,185,33,0.25)]"
                    : "text-steel-300 hover:bg-abyss-800/60 hover:text-steel-100",
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4",
                    isActive
                      ? "text-gold-300"
                      : "text-steel-400 group-hover:text-gold-400",
                  )}
                />
                <span className="flex-1 font-medium">{n.label}</span>
                {isActive && (
                  <span className="h-1.5 w-1.5 rounded-full bg-gold-400" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-steel-700/40 p-3">
          {FOOT.map((n) => {
            const Icon = n.icon;
            const isActive = active === n.id;
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => navigate(n.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  isActive
                    ? "bg-gold-500/10 text-gold-200 shadow-[inset_0_0_0_1px_rgba(227,185,33,0.25)]"
                    : "text-steel-400 hover:bg-abyss-800/60 hover:text-steel-100",
                )}
              >
                <Icon className={cn("h-4 w-4", isActive && "text-gold-300")} />
                {n.label}
                {isActive && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-gold-400" />
                )}
              </button>
            );
          })}

          {canSeeTrash && (
           <button
             type="button"
             onClick={() => navigate("lixeira")}
             className={cn(
               "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
               active === "lixeira"
                 ? "bg-gold-500/10 text-gold-200 shadow-[inset_0_0_0_1px_rgba(227,185,33,0.25)]"
                 : "text-steel-400 hover:bg-abyss-800/60 hover:text-steel-100",
             )}
           >
             <Trash2 className={cn("h-4 w-4", active === "lixeira" && "text-gold-300")} />
             Lixeira
           </button>
         )}

          <button
            type="button"
            onClick={() => logout()}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-red-400 transition-colors hover:bg-red-500/10"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>

          <div className="mt-3 rounded-lg border border-steel-700/50 bg-abyss-900/60 p-3 text-[10px] text-steel-400">
            <p className="font-bold uppercase tracking-widest text-gold-400">
              Tenant: {user?.tenantId ? user.tenantId.substring(0, 8) : "Global"}
            </p>
            <p className="mt-1">Integração ERP Conectada</p>
          </div>
        </div>
      </aside>
    </>
  );
}