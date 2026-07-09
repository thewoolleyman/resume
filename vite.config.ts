import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vitest/config";

// Vite + Vitest configuration. The SvelteKit plugin compiles routes and
// components (and .svelte component tests); Vitest measures coverage of every
// first-party src/** file at the non-negotiable 100% line/branch floor
// (SPECIFICATION/non-functional-requirements.md §"Test coverage expectations",
// enforced additionally by scripts/check-coverage.ts against
// coverage/coverage-summary.json).
export default defineConfig({
  plugins: [sveltekit()],
  // Under Vitest, resolve Svelte's browser (client) build so the `mount` API
  // used by component tests works in jsdom; the production build is unaffected.
  ...(process.env["VITEST"] === undefined
    ? {}
    : { resolve: { conditions: ["browser"] } }),
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "json-summary"],
      reportsDirectory: "coverage",
      include: ["src/**"],
      exclude: [
        "src/**/*.test.ts",
        "src/**/*.spec.ts",
        "src/**/*.d.ts",
        "src/**/*.html",
        "src/**/__fixtures__/**",
      ],
      thresholds: {
        lines: 100,
        branches: 100,
        functions: 100,
        statements: 100,
      },
    },
  },
});
