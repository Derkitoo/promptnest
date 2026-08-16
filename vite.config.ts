import { sites } from "@openai/sites-vite-plugin";
import vinext from "vinext";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import hostingConfig from "./.openai/hosting.json";

const SITE_CREATOR_PLACEHOLDER_DATABASE_ID =
  "00000000-0000-4000-8000-000000000000";

const { d1, r2 } = hostingConfig;

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === "seatbelt";

const localBindingConfig = {
  main: "./worker/index.ts",
  compatibility_flags: ["nodejs_compat"],
  d1_databases: d1
    ? [
        {
          binding: d1,
          database_name: "site-creator-d1",
          database_id: SITE_CREATOR_PLACEHOLDER_DATABASE_ID,
        },
      ]
    : [],
  r2_buckets: r2
    ? [
        {
          binding: r2,
          bucket_name: "site-creator-r2",
        },
      ]
    : [],
};

const pwaPlugin = VitePWA({
  registerType: "autoUpdate",
  injectRegister: "auto",
  manifest: {
    name: "PromptNest - Prompt Vault",
    short_name: "PromptNest",
    description: "Bibliothèque de prompts local-first installable et synchronisée.",
    theme_color: "#183b2b",
    background_color: "#f7f8f6",
    display: "standalone",
    orientation: "portrait",
    start_url: "./",
    scope: "./",
    icons: [
      {
        src: "pwa-192x192.svg",
        sizes: "192x192",
        type: "image/svg+xml"
      },
      {
        src: "pwa-512x512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any maskable"
      }
    ]
  },
  workbox: {
    globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"]
  }
});

export default defineConfig(async ({ command }) => {
  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= "false";
  process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
  process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import("@cloudflare/vite-plugin");

  return {
    server: isCodexSeatbeltSandbox
      ? { watch: { useFsEvents: false, usePolling: true } }
      : undefined,
    plugins: command === "serve" ? [vinext(), pwaPlugin] : [
      vinext(), sites(), pwaPlugin, cloudflare({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
        config: localBindingConfig,
      })
    ],
  };
});
