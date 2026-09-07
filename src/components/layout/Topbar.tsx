import { useState, useEffect, useRef } from "react";
import {
  Bell,
  Search,
  ScanLine,
  ChevronDown,
  Plus,
  LogOut,
  X,
  AlertTriangle,
  Clock,
  Inbox,
  Camera,
  Keyboard,
  Barcode,
} from "lucide-react";
import { Button } from "../ui/Button";
import { useAuth } from "../../contexts/AuthContext";
import {
  notificationsService,
  type AppNotification,
} from "../../services/notifications.service";
import { cn } from "@/utils/cn";

interface TopbarProps {
  onScanDanfe?: (scannedValue: string) => void;
  onNewTicket?: () => void;
  onSearch?: (query: string) => void;
  onNotificationClick?: (ticketId: string) => void;
}

export function Topbar({
  onScanDanfe,
  onNewTicket,
  onSearch,
  onNotificationClick,
}: TopbarProps) {
  const { user, logout } = useAuth();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifPage, setNotifPage] = useState(1);
  const [notifHasMore, setNotifHasMore] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Estados do Modal de Leitura / Câmera
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [scanMode, setScanMode] = useState<"camera" | "manual">("camera");
  const [manualCode, setManualCode] = useState("");
  const [cameraError, setCameraError] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Tratamento da Chave DANFE ou Código de Barras
  const processDanfeCode = (rawCode: string) => {
    const cleaned = rawCode.replace(/\D/g, "").trim();
    let finalQuery = cleaned;

    // Se for Chave DANFE completa (44 dígitos), extrai o número da NF (posições 26 a 34)
    if (cleaned.length === 44) {
      const nfNumber = parseInt(cleaned.substring(25, 34), 10).toString();
      finalQuery = nfNumber;
    }

    setSearchQuery(finalQuery);
    if (onSearch) onSearch(finalQuery);
    if (onScanDanfe) onScanDanfe(finalQuery);

    closeScanModal();
  };

  // Inicializa o Stream de Vídeo para a Câmera
  useEffect(() => {
    let animationFrameId: number;

    async function startCamera() {
      if (isScanModalOpen && scanMode === "camera") {
        setCameraError(null);
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" },
          });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }

          // Detecção Nativas de Códigos de Barra no Navegador
          if ("BarcodeDetector" in window) {
            const barcodeDetector = new (window as any).BarcodeDetector({
              formats: ["code_128", "ean_13", "qr_code"],
            });

            const detectCode = async () => {
              if (videoRef.current && videoRef.current.readyState === 4) {
                try {
                  const barcodes = await barcodeDetector.detect(
                    videoRef.current,
                  );
                  if (barcodes.length > 0) {
                    processDanfeCode(barcodes[0].rawValue);
                    return;
                  }
                } catch (err) {
                  console.warn("Erro ao detectar código:", err);
                }
              }
              animationFrameId = requestAnimationFrame(detectCode);
            };
            detectCode();
          }
        } catch (err) {
          console.error("Erro ao acessar câmera:", err);
          setCameraError(
            "Não foi possível acessar a câmera. Verifique as permissões.",
          );
        }
      }
    }

    startCamera();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      stopCamera();
    };
  }, [isScanModalOpen, scanMode]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const closeScanModal = () => {
    stopCamera();
    setIsScanModalOpen(false);
    setManualCode("");
    setCameraError(null);
  };

async function loadNotifications(page: number, append: boolean) {
   try {
     setLoadingNotifications(true);
     const result = await notificationsService.getPage(page, 10);
     setNotifications((prev) => (append ? [...prev, ...result.notifications] : result.notifications));
     setUnreadCount(result.unreadCount);
     setNotifPage(result.pagination.page);
     setNotifHasMore(result.pagination.hasMore);
    } catch (error) {
      console.error("Erro ao carregar notificações:", error);
    } finally {
      setLoadingNotifications(false);
    }
  }

  useEffect(() => {
    loadNotifications(1, false);
    // Verifica novidades a cada 60s — simples e suficiente para o volume
    // esperado, sem precisar de WebSocket/SSE agora.
    const interval = setInterval(() => loadNotifications(1, false), 60_000);
    return () => clearInterval(interval);
  }, []);

  async function handleNotificationClick(n: AppNotification) {
    if (!n.read) {
      await notificationsService.markAsRead(n.id);
      setNotifications((prev) => prev.map((item) => (item.id === n.id ? { ...item, read: true } : item)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    if (n.ticketId && onNotificationClick) {
      onNotificationClick(n.ticketId);
    }
    setNotificationsOpen(false);
  }

  // Fechar menus ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notifRef.current &&
        !notifRef.current.contains(event.target as Node)
      ) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "US";

  return (
    <>
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
            onClick={() => setIsScanModalOpen(true)}
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

          {/* Notificações */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-steel-700/60 bg-abyss-900/60 text-steel-200 hover:border-gold-500/40 hover:text-gold-300"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-gold-400 animate-pulse" />
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-steel-700/60 bg-abyss-900 p-4 shadow-2xl backdrop-blur-md z-50">
                <div className="flex items-center justify-between border-b border-steel-800 pb-2 mb-3">
                  <h4 className="text-xs font-bold text-steel-100 uppercase tracking-wider">
                    Notificações Operacionais
                  </h4>
                  <button
                    type="button"
                    onClick={() => setNotificationsOpen(false)}
                    className="rounded p-1 text-steel-400 hover:bg-steel-800 hover:text-steel-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                  {notifications.length === 0 ? (
                    <div className="text-center py-6 text-steel-400">
                      <Inbox className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      <p className="text-xs">Nenhum alerta pendente.</p>
                    </div>
                  ) : (
                   <>
                     {notifications.map((item) => (
                       <button
                         key={item.id}
                         onClick={() => handleNotificationClick(item)}
                         className={cn(
                           "flex w-full items-start gap-3 rounded-lg p-2.5 text-left border transition-colors",
                           item.read
                             ? "bg-abyss-800/40 border-steel-700/30 text-steel-400"
                             : "bg-abyss-800/80 border-gold-500/30 text-steel-200",
                         )}
                       >
                         {!item.read && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-400" />}
                         <Clock className={cn("h-4 w-4 shrink-0 mt-0.5", item.read ? "text-steel-500" : "text-gold-400")} />
                         <div className="flex-1 min-w-0">
                           <p className={cn("text-xs font-semibold", item.read ? "text-steel-300" : "text-steel-100")}>
                             {item.title}
                           </p>
                           <p className="text-[11px] mt-0.5">{item.message}</p>
                           <p className="mt-1 text-[10px] text-steel-500">
                             {new Date(item.createdAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                           </p>
                         </div>
                       </button>
                     ))}
                     {notifHasMore && (
                       <button
                         onClick={() => loadNotifications(notifPage + 1, true)}
                         disabled={loadingNotifications}
                         className="w-full py-2 text-center text-[11px] font-semibold text-gold-300 hover:underline"
                       >
                         {loadingNotifications ? "Carregando..." : "Carregar mais"}
                       </button>
                     )}
                   </>
                   )}
                 </div>
                
          </div>
            )}


          {/* Menu de Usuário */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 rounded-lg border border-steel-700/60 bg-abyss-900/60 p-1 pr-3 hover:border-gold-500/40"
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

      {/* MODAL ESTILIZADO DE LEITURA DANFE / CÂMERA */}
      {isScanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-steel-700 bg-abyss-900 p-5 shadow-2xl text-steel-100">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-steel-800 pb-3">
              <div className="flex items-center gap-2">
                <Barcode className="h-5 w-5 text-gold-400" />
                <h3 className="font-bold text-sm text-steel-50">
                  Escanear / Identificar DANFE
                </h3>
              </div>
              <button
                type="button"
                onClick={closeScanModal}
                className="rounded-lg p-1 text-steel-400 hover:bg-steel-800 hover:text-steel-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Abas: Câmera vs Digitação Manual */}
            <div className="mt-4 flex rounded-lg bg-abyss-950 p-1 border border-steel-800">
              <button
                type="button"
                onClick={() => setScanMode("camera")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md py-1.5 text-xs font-semibold transition-all ${
                  scanMode === "camera"
                    ? "bg-gold-500/20 text-gold-300 border border-gold-500/30"
                    : "text-steel-400 hover:text-steel-200"
                }`}
              >
                <Camera className="h-4 w-4" />
                Câmera ao Vivo
              </button>
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setScanMode("manual");
                }}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md py-1.5 text-xs font-semibold transition-all ${
                  scanMode === "manual"
                    ? "bg-gold-500/20 text-gold-300 border border-gold-500/30"
                    : "text-steel-400 hover:text-steel-200"
                }`}
              >
                <Keyboard className="h-4 w-4" />
                Digitar Código
              </button>
            </div>

            {/* Conteúdo: Câmera */}
            {scanMode === "camera" && (
              <div className="mt-4 space-y-3">
                <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-steel-800 bg-abyss-950 flex items-center justify-center">
                  {cameraError ? (
                    <div className="p-4 text-center text-xs text-red-400">
                      <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-red-400" />
                      {cameraError}
                    </div>
                  ) : (
                    <>
                      <video
                        ref={videoRef}
                        className="h-full w-full object-cover"
                        playsInline
                        muted
                      />
                      {/* Mira / Linha Laser Visual */}
                      <div className="absolute inset-x-8 top-1/2 h-0.5 -translate-y-1/2 bg-red-500 shadow-[0_0_8px_#ef4444] animate-pulse" />
                      <span className="absolute bottom-2 text-[10px] text-steel-300 bg-abyss-950/80 px-2 py-0.5 rounded backdrop-blur-sm">
                        Aponta para o código de barras da Nota
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Conteúdo: Digitação Manual */}
            {scanMode === "manual" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (manualCode.trim()) processDanfeCode(manualCode);
                }}
                className="mt-4 space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold text-steel-300 mb-1">
                    Número da NF ou Chave de Acesso (44 dígitos)
                  </label>
                  <input
                    type="text"
                    autoFocus
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="Ex: 3524011234567800019555001000012345..."
                    className="w-full rounded-lg border border-steel-700 bg-abyss-950 px-3 py-2 text-sm text-steel-100 focus:border-gold-500 focus:outline-none font-mono"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={closeScanModal}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={!manualCode.trim()}>
                    Filtrar Ticket
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
