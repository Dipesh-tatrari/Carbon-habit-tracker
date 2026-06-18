import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Output to dist/ (Render Static Site publish directory)
  build: {
    outDir: "dist",
  },
  server: {
    // In dev, forward /api/* to the local Express proxy server.
    // In production, VITE_API_URL points to the deployed Render server instead.
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
  test: {
    globals: true,
    environment: "node",
  },
});
