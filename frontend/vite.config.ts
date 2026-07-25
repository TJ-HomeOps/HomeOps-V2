import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // The dev server is reached through the reverse proxy, which forwards a
    // Host header Vite rejects unless it is listed here.
    allowedHosts: ["ops.tyrstedit.dk"],
    // The proxy terminates TLS and forwards only this port, so the API has to
    // be reachable on the same origin. Calling the backend's own address
    // directly would be blocked as mixed content on an HTTPS page.
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3000",
        changeOrigin: true,
      },
    },
  },
});
