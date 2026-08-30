import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { Toaster } from "sonner";

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
