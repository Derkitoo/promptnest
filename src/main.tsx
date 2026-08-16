import React from "react";
import ReactDOM from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import PromptNestApp from "../app/prompt-vault-app";
import "../app/globals.css";

// Enregistrement du Service Worker PWA avec mise à jour automatique
registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PromptNestApp />
  </React.StrictMode>
);
