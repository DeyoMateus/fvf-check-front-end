import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { Toaster } from "sonner";

// virtual:pwa-register só existe quando o build roda com o plugin VitePWA
// ativo (npm run build:pwa) — no build do Painel esse módulo nem é
// resolvido, então o import precisa ser condicional e dinâmico.
if (import.meta.env.MODE === "pwa") {
  import("virtual:pwa-register").then(({ registerSW }) => {
    registerSW({
      immediate: true,
      onNeedRefresh() {
        console.info("[PWA] Nova versão disponível — será aplicada na próxima abertura.");
      },
      onOfflineReady() {
        console.info("[PWA] App pronto para uso offline.");
      },
    });
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
    <Toaster
      richColors
      position="top-center"
      toastOptions={{
        style: {
          fontSize: "15px",
          padding: "16px 24px",
        },
      }}
    />
  </StrictMode>,
);
