import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/ - Vite Configuration
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.png", "chrome-extension/**/*"],
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        navigateFallbackDenylist: [/^\/api/, /^\/~oauth/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/bamlead\.com\/api\/.*/i,
            handler: "NetworkOnly",
          },
        ],
      },
      manifest: {
        name: "BamLead - AI Lead Generation",
        short_name: "BamLead",
        description: "AI-Powered B2B Lead Generation & Outreach Platform",
        theme_color: "#1a1a2e",
        background_color: "#1a1a2e",
        display: "standalone",
        scope: "/",
        start_url: "/dashboard",
        orientation: "any",
        categories: ["business", "productivity"],
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },
  optimizeDeps: {
    include: ["@tanstack/react-query", "framer-motion"],
  },
}));
