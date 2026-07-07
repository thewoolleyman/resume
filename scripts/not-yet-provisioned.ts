// Honest placeholder for package scripts whose gate or toolchain artifact has
// not been provisioned yet (plan/guardrail/research/findings.md §"Work
// slices"). Exits 3 — the precondition-failure code from
// SPECIFICATION/non-functional-requirements.md §"Exit-code baseline" — so a
// not-yet-provisioned script can never be mistaken for a passing gate.
//
// Usage: bun scripts/not-yet-provisioned.ts <script-name>

interface Provisioner {
  readonly workItem: string | null;
  readonly provider: string;
}

const PROVISIONERS: Record<string, Provisioner> = {
  dev: {
    workItem: null,
    provider:
      "the SvelteKit app scaffold (a later guardrail slice or plan/mvp)",
  },
  build: {
    workItem: null,
    provider:
      "the SvelteKit app scaffold (a later guardrail slice or plan/mvp)",
  },
  "test:unit": {
    workItem: null,
    provider:
      "the Vitest toolchain provisioned by later guardrail slices (see plan/guardrail/research/findings.md)",
  },
  "test:integration": {
    workItem: null,
    provider:
      "the Vitest toolchain provisioned by later guardrail slices (see plan/guardrail/research/findings.md)",
  },
  "test:e2e": {
    workItem: null,
    provider:
      "the Playwright toolchain provisioned by later guardrail slices (see plan/guardrail/research/findings.md)",
  },
  "test:coverage": {
    workItem: "li-m2trzv",
    provider: "Coverage and property/fuzz gates",
  },
  "test:property": {
    workItem: "li-m2trzv",
    provider: "Coverage and property/fuzz gates",
  },
  "check:scenarios": {
    workItem: "li-hb77ad",
    provider: "Scenario coverage gate (`check:scenarios`)",
  },
  "check:result": {
    workItem: "li-oaxjqm",
    provider: "Result/ROP enforcement gate (`check:result`)",
  },
  "check:memory": {
    workItem: "li-6b6u6m",
    provider: "Local memory guardrail and discipline inventory",
  },
  "tdd-commit": {
    workItem: "li-avk7d7",
    provider: "Content-triggered Red -> Green TDD commit gate",
  },
};

const name = process.argv[2];
if (name === undefined || !(name in PROVISIONERS)) {
  console.error(
    "usage: bun scripts/not-yet-provisioned.ts <script-name>\n" +
      `known script names: ${Object.keys(PROVISIONERS).join(", ")}`,
  );
  process.exit(2);
}

const { workItem, provider } = PROVISIONERS[name] as Provisioner;
const source = workItem === null ? provider : `${workItem} — ${provider}`;
console.error(
  `\`bun run ${name}\` is not yet provisioned.\n` +
    `It arrives with ${source}.\n` +
    'Provisioning order: plan/guardrail/research/findings.md §"Work slices".',
);
process.exit(3);
