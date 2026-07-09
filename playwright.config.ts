import { defineConfig, devices } from "@playwright/test";

// Playwright end-to-end runner for the browser-observable phase-1 scenarios
// mapped in scenario-coverage.json (SPECIFICATION/non-functional-requirements.md
// §"Top-of-pyramid discipline"). The webServer builds the SvelteKit app and
// serves the prerendered output so the specs exercise the real production
// render path, not the dev server.
const PORT = 4173;

export default defineConfig({
  testDir: "e2e",
  testMatch: /.*\.e2e\.ts/,
  fullyParallel: true,
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${String(PORT)}`,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `vite build && vite preview --port ${String(PORT)} --strictPort`,
    port: PORT,
    reuseExistingServer: !process.env["CI"],
    timeout: 180_000,
  },
});
