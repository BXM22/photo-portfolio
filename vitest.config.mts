// ============================================================================
// VITEST CONFIG — unit/integration test runner.
// ============================================================================
// LEARNING NOTE: Vitest vs Jest — Vitest reuses Vite's build pipeline, so it
// understands TypeScript, JSX, and path aliases (like our "@/lib/...")
// out of the box with almost no config, and runs noticeably faster because
// it doesn't need a separate Babel/ts-jest transform step. It's become the
// default choice for new Vite/Next.js projects for that reason.
// ============================================================================

import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    // Playwright end-to-end specs live in tests/e2e and have their own
    // runner/config (playwright.config.ts) — excluding that folder here
    // stops Vitest from also trying (and failing) to run them.
    exclude: ["node_modules", "tests/e2e"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
