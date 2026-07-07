// Lint baseline per SPECIFICATION/non-functional-requirements.md
// §"TypeScript quality gates": type-aware typescript-eslint
// strict-type-checked, Svelte-aware linting with accessibility diagnostics
// (svelte/valid-compile surfaces the Svelte compiler's a11y warnings as lint
// errors), import-order rules (perfectionist), and Prettier compatibility.
// Zero warnings are tolerated: the lint script runs with --max-warnings 0
// and the aggregate check fails when that flag is dropped.
import eslint from "@eslint/js";
import prettier from "eslint-config-prettier";
import perfectionist from "eslint-plugin-perfectionist";
import svelte from "eslint-plugin-svelte";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "node_modules/",
      ".svelte-kit/",
      "build/",
      "dist/",
      "coverage/",
      "test-results/",
      "playwright-report/",
      ".vercel/",
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...svelte.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: [".svelte"],
      },
    },
  },
  {
    plugins: { perfectionist },
    rules: {
      "perfectionist/sort-imports": "error",
      "perfectionist/sort-named-imports": "error",
      // Svelte compiler diagnostics — including accessibility (a11y_*)
      // warnings — fail the lint rather than passing silently.
      "svelte/valid-compile": "error",
      // Result/ROP discipline (scripts/check-result.ts verifies this stays
      // effectively enabled): switches over DomainError.kind must be
      // exhaustive.
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      // First-party import-boundary placeholder: deep-importing across
      // future src/** layer boundaries is rejected; the concrete layer map
      // activates with the product source it governs.
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["../src/*/*", "src/*/*"],
              message:
                "Import first-party modules through their layer's public surface, not deep paths.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["**/*.js", "**/*.mjs", "**/*.cjs"],
    ...tseslint.configs.disableTypeChecked,
  },
  prettier,
);
