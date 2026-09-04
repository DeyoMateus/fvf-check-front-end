import { useEffect, useState } from "react";
import { Share, X, PlusSquare } from "lucide-react";


const DISMISS_KEY ="fvf-ios-install-banner-dismissed";

function isIosDevice() {
    const ua = navigator.userAgent;
    return /iPad|iPhone|iPod/.test(ua) && !("MSStream" in window);
}

function isRunningStandalone() {
     // iOS Safari expõe isso quando o app já foi "Adicionado à Tela de Início"
  return (
    (window.navigator as any).standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches
  );
}

export function IosInstallBanner() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const alreadyDimissed = localStorage.getItem(DISMISS_KEY) === "true";
        if(isIosDevice() && !isRunningStandalone() && !alreadyDimissed) {
            setVisible(true);
        }
    }, []);

    function dismiss() {
        localStorage.setItem(DISMISS_KEY, "true");
        setVisible(false);
    }
    if (!visible) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-[60] rounded-xl border border-gold-500/40 bg-abyss-900/95 p-3.5 shadow-2xl backdrop-blur">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gold-500/30 bg-gold-500/10 text-gold-300">
          <PlusSquare className="h-4.5 w-4.5" />
        </div>
        <div className="flex-1 text-xs">
          <p className="font-bold text-steel-50">Instale o FVF Check no seu iPhone</p>
          <p className="mt-1 leading-relaxed text-steel-300">
            Toque em{" "}
            <span className="inline-flex items-center gap-1 rounded bg-abyss-800 px-1.5 py-0.5 font-semibold text-gold-300">
              <Share className="h-3 w-3" /> Compartilhar
            </span>{" "}
            na barra do Safari e depois em{" "}
            <span className="font-semibold text-gold-300">"Adicionar à Tela de Início"</span> — assim
            você abre o app direto, mesmo sem internet.
          </p>
        </div>
        <button
          onClick={dismiss}
          className="shrink-0 rounded-md p-1 text-steel-400 hover:bg-abyss-800 hover:text-steel-100"
          aria-label="Fechar aviso"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

}