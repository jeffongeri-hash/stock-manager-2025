import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
// NOTE: vite-plugin-pwa was removed because the cached service-worker shell
// kept serving the old homepage to returning users. A static kill-switch
// service worker at public/sw.js (and /service-worker.js) replaces any
// previously-installed SW, purges its caches, and unregisters itself.
// public/manifest.json is still served for "Add to Home Screen" installability.
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
