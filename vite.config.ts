import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { VitePWA } from "vite-plugin-pwa";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const isPwaBuild = mode === "pwa";

  return {
    plugins: [
      react(),
      tailwindcss(),

      // Singlefile ativo apenas para build do painel
      ...(!isPwaBuild ? [viteSingleFile()] : []),

      // Sempre mantém o plugin registrado para fornecer o virtual:pwa-register,
      // mas desativa a geração de SW se não for modo pwa
      VitePWA({
        disable: !isPwaBuild,
        registerType: "autoUpdate",
        includeAssets: [
          "favicon.ico",
          "apple-touch-icon.png",
          "icons/icon-192.png",
          "icons/icon-512.png",
        ],
        manifest: {
          name: "FVF Check • Montador",
          short_name: "FVF Check",
          description:
            "Registro de chamados de assistência técnica em campo, com suporte offline.",
          theme_color: "#020816",
          background_color: "#020816",
          display: "standalone",
          orientation: "portrait",
          start_url: "/",
          scope: "/",
          icons: [
            {
              src: "icons/icon-192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "icons/icon-512.png",
              sizes: "512x512",
              type: "image/png",
            },
            {
              src: "icons/icon-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
          navigateFallback: "/index.html",
          navigateFallbackDenylist: [/^\/api\//],
          runtimeCaching: [],
        },
        devOptions: {
          enabled: true,
        },
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    build: {
      outDir: isPwaBuild ? "dist-pwa" : "dist-painel",
      emptyOutDir: true,
    },
  };
});
