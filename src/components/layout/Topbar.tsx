import { useState } from "react";
import { Bell, Search, ScanLine, ChevronDown, Plus, LogOut } from "lucide-react";
import { Button } from "../ui/Button";
import { useAuth } from "../../contexts/AuthContext";

interface TopbarProps {
  onScanDanfe?: () => void;
  onNewTicket?: () => void;
  onSearch?: (query: string) => void;
}

export function Topbar({ onScanDanfe, onNewTicket, onSearch }: TopbarProps) {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Pega as duas primeiras letras do nome do usuário para o Avatar
  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "US";

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && onSearch) {
      onSearch(searchQuery);
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-steel-700/40 bg-abyss-950/70 px-4 backdrop-blur-md md:px-6">
      {/* Busca Ativa */}
      <div className="relative hidden flex-1 max-w-xl md:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel-400" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          placeholder="Buscar por ticket, cliente, NF-e (Danfe) ou lote… (Aperte Enter)"
          className="h-10 w-full rounded-lg border border-steel-700/60 bg-abyss-900/60 pl-9 pr-3 text-sm text-steel-100 placeholder:text-steel-500 focus:border-gold-500/60 focus:outline-none focus:ring-2 focus:ring-gold-400/20"
        />
        <kbd className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border border-steel-700 bg-abyss-800 px-1.5 py-0.5 text-[10px] font-mono text-steel-400 md:block">
          ⌘ K
        </kbd>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="secondary"
          size="md"
          onClick={onScanDanfe}
          className="hidden sm:inline-flex"
          aria-label="Escanear Danfe"
        >
          <ScanLine className="h-4 w-4 text-gold-300" />
          Escanear Danfe
        </Button>

        <Button onClick={onNewTicket} className="hidden sm:inline-flex">
          <Plus className="h-4 w-4" />
          Novo Ticket
        </Button>

        <button
          aria-label="Notificações"
          className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-steel-700/60 bg-abyss-900/60 text-steel-200 hover:border-gold-500/40 hover:text-gold-300"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-gold-400 pulse-dot" />
        </button>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 rounded-lg border border-steel-700/60 bg-abyss-900/60 p-1 pr-3 transition-colors hover:border-gold-500/40"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-gold-400 to-gold-600 font-bold text-abyss-950">
              {userInitials}
            </div>
            <div className="hidden text-left md:block">
              <p className="text-xs font-semibold text-steel-100">
                {user?.name || "Usuário"}
              </p>
              <p className="text-[10px] text-steel-400">
                {user?.role || "Operador"}
              </p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-steel-400" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl border border-steel-700/60 bg-abyss-900 p-1.5 shadow-2xl backdrop-blur-md">
              <div className="border-b border-steel-800 px-3 py-2 md:hidden">
                <p className="text-xs font-semibold text-steel-100">
                  {user?.name}
                </p>
                <p className="text-[10px] text-steel-400">{user?.email}</p>
              </div>

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