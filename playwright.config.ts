// ============================================================================
// PLAYWRIGHT CONFIG — end-to-end (E2E) test runner.
// ============================================================================
// LEARNING NOTE: unit tests (Vitest, see vitest.config.mts) check individual
// functions in isolation. E2E tests, in contrast, drive a REAL browser
// against your REAL running app to verify entire user flows work — "can a
// visitor actually load the homepage and see a gallery." They're slower and
// more expensive to run, so a small number of high-value E2E tests
// (smoke tests for the pages that matter most) alongside many fast unit
// tests is the standard pyramid shape for a test suite.
// ============================================================================

import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  // `webServer` tells Playwright to boot the app itself before running
  // tests (and reuse an already-running one during local development) —
  // you don't have to remember to `npm run dev` in a separate terminal
  // first.
  webServer: {
    command: "npm run build && npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
