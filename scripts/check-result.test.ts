// Harness test for the Result/ROP enforcement gate (work item li-oaxjqm;
// plan/guardrail/research/findings.md slice 7).
//
// Pins SPECIFICATION/non-functional-requirements.md §"Result and
// railway-oriented programming discipline": first-party core modules — the
// top-level role dirs (src/data|domain|search|grounding|mcp-contracts) AND the
// selected phase-1 `$lib` core dirs (src/lib/{data,domain,search,sort,markdown},
// where scenario-coverage.json maps the phase-1 core tests) — expose
// Result-returning public functions; boundary modules (src/{adapters,server,api}
// and src/lib/{server,adapters,api}) expose AsyncResult/Promise<Result>; Result
// return values may not be ignored;
// catch clauses outside the approved boundary-adapter directories must
// rethrow (no blanket catch that hides bugs); DomainError must never be
// thrown as an exception; UI modules (src/routes|components) must not
// render raw Error payloads (.message/.stack); and the type-aware ESLint
// rules (no-floating-promises, switch-exhaustiveness-check) are enabled at
// error severity. With no src/** yet the gate runs armed-but-vacuous and
// still verifies the ESLint baseline, fail-closing when product source
// appears without the discipline.

import { afterAll, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const repoRoot = join(import.meta.dir, "..");
const resultScript = join(repoRoot, "scripts", "check-result.ts");

const fixtures: string[] = [];
afterAll(() => {
  for (const dir of fixtures) {
    rmSync(dir, { recursive: true, force: true });
  }
});

const RESULT_PRELUDE = `export type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };
export type DomainError = { readonly kind: "parse-error"; readonly detail: string };
`;

function makeFixture(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), "resume-result-fixture-"));
  fixtures.push(dir);
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(join(dir, dirname(path)), { recursive: true });
    writeFileSync(join(dir, path), content);
  }
  return dir;
}

function runResult(root: string): { exitCode: number | null; output: string } {
  const run = Bun.spawnSync({
    cmd: ["bun", resultScript, "--project-root", root],
    cwd: repoRoot,
  });
  return {
    exitCode: run.exitCode,
    output: run.stdout.toString() + run.stderr.toString(),
  };
}

describe("Result/ROP enforcement gate (li-oaxjqm)", () => {
  test("the repository passes with the discipline active (src verified) and the ESLint baseline verified", () => {
    const { exitCode, output } = runResult(repoRoot);
    expect(output).toContain("discipline: ok");
    expect(output).not.toContain("FAIL");
    expect(exitCode).toBe(0);
  }, 60000);

  test("a compliant fixture tree passes", () => {
    const dir = makeFixture({
      "src/domain/shared.ts": RESULT_PRELUDE,
      "src/domain/parse.ts":
        'import type { DomainError, Result } from "./shared";\n' +
        "export function parse(raw: string): Result<number, DomainError> {\n" +
        "  const value = Number(raw);\n" +
        "  return Number.isNaN(value)\n" +
        '    ? { ok: false, error: { kind: "parse-error", detail: raw } }\n' +
        "    : { ok: true, value };\n" +
        "}\n",
    });
    const { exitCode, output } = runResult(dir);
    expect(output).not.toContain("FAIL");
    expect(exitCode).toBe(0);
  }, 60000);

  test("a core export not returning Result fails", () => {
    const dir = makeFixture({
      "src/domain/bad.ts":
        "export function count(): number {\n  return 1;\n}\n",
    });
    const { exitCode, output } = runResult(dir);
    expect(exitCode).toBe(1);
    expect(output).toContain("src/domain/bad.ts");
    expect(output).toContain("Result");
  }, 60000);

  test("a core export without a declared return type fails", () => {
    const dir = makeFixture({
      "src/search/infer.ts": "export const find = (q: string) => q.length;\n",
    });
    const { exitCode, output } = runResult(dir);
    expect(exitCode).toBe(1);
    expect(output).toContain("src/search/infer.ts");
  }, 60000);

  test("a boundary export returning a bare (non-Promise) value fails", () => {
    const dir = makeFixture({
      "src/adapters/shared.ts": RESULT_PRELUDE,
      "src/adapters/fetcher.ts":
        'import type { DomainError, Result } from "./shared";\n' +
        "export function fetchIt(): Result<string, DomainError> {\n" +
        '  return { ok: true, value: "x" };\n' +
        "}\n",
    });
    const { exitCode, output } = runResult(dir);
    expect(exitCode).toBe(1);
    expect(output).toContain("src/adapters/fetcher.ts");
    expect(output).toContain("AsyncResult");
  }, 60000);

  test("an ignored Result return value fails", () => {
    const dir = makeFixture({
      "src/domain/shared.ts": RESULT_PRELUDE,
      "src/domain/use.ts":
        'import type { DomainError, Result } from "./shared";\n' +
        "export function parse(raw: string): Result<number, DomainError> {\n" +
        "  return { ok: true, value: raw.length };\n" +
        "}\n" +
        "export function useIt(): Result<number, DomainError> {\n" +
        '  parse("discarded");\n' +
        '  return parse("kept");\n' +
        "}\n",
    });
    const { exitCode, output } = runResult(dir);
    expect(exitCode).toBe(1);
    expect(output).toContain("ignored Result");
  }, 60000);

  test("a Result assigned to a never-read variable fails (li-y31rgl)", () => {
    const dir = makeFixture({
      "src/domain/shared.ts": RESULT_PRELUDE,
      "src/domain/bind.ts":
        'import type { DomainError, Result } from "./shared";\n' +
        "export function parse(raw: string): Result<number, DomainError> {\n" +
        "  return { ok: true, value: raw.length };\n" +
        "}\n" +
        "export function useIt(): Result<number, DomainError> {\n" +
        '  const ignored = parse("discarded");\n' +
        '  return parse("kept");\n' +
        "}\n",
    });
    const { exitCode, output } = runResult(dir);
    expect(exitCode).toBe(1);
    expect(output).toContain("ignored Result");
    expect(output).toContain("src/domain/bind.ts");
  }, 60000);

  test("a Result binding whose only reads are pure discards fails (li-y31rgl reopen)", () => {
    const dir = makeFixture({
      "src/domain/shared.ts": RESULT_PRELUDE,
      "src/domain/void-read.ts":
        'import type { DomainError, Result } from "./shared";\n' +
        "export function parse(raw: string): Result<number, DomainError> {\n" +
        "  return { ok: true, value: raw.length };\n" +
        "}\n" +
        "export function useIt(): Result<number, DomainError> {\n" +
        '  const result = parse("discarded");\n' +
        "  void result;\n" +
        "  return { ok: true, value: 1 };\n" +
        "}\n",
      "src/domain/bare-read.ts":
        'import type { DomainError, Result } from "./shared";\n' +
        "export function parse(raw: string): Result<number, DomainError> {\n" +
        "  return { ok: true, value: raw.length };\n" +
        "}\n" +
        "export function useIt(): Result<number, DomainError> {\n" +
        '  const result = parse("discarded");\n' +
        "  result;\n" +
        "  return { ok: true, value: 1 };\n" +
        "}\n",
    });
    const { exitCode, output } = runResult(dir);
    expect(exitCode).toBe(1);
    expect(output).toContain("ignored Result");
    expect(output).toContain("src/domain/void-read.ts");
    expect(output).toContain("src/domain/bare-read.ts");
  }, 60000);

  test("a Result binding that IS read later passes", () => {
    const dir = makeFixture({
      "src/domain/shared.ts": RESULT_PRELUDE,
      "src/domain/read.ts":
        'import type { DomainError, Result } from "./shared";\n' +
        "export function parse(raw: string): Result<number, DomainError> {\n" +
        "  return { ok: true, value: raw.length };\n" +
        "}\n" +
        "export function useIt(): Result<number, DomainError> {\n" +
        '  const kept = parse("kept");\n' +
        "  return kept;\n" +
        "}\n",
    });
    const { exitCode, output } = runResult(dir);
    expect(output).not.toContain("FAIL");
    expect(exitCode).toBe(0);
  }, 60000);

  test("a void-discarded Result call fails", () => {
    const dir = makeFixture({
      "src/domain/shared.ts": RESULT_PRELUDE,
      "src/domain/voided.ts":
        'import type { DomainError, Result } from "./shared";\n' +
        "export function parse(raw: string): Result<number, DomainError> {\n" +
        "  return { ok: true, value: raw.length };\n" +
        "}\n" +
        "export function useIt(): Result<number, DomainError> {\n" +
        '  void parse("discarded");\n' +
        '  return parse("kept");\n' +
        "}\n",
    });
    const { exitCode, output } = runResult(dir);
    expect(exitCode).toBe(1);
    expect(output).toContain("ignored Result");
  }, 60000);

  test("a swallowing catch whose only throw sits in a nested function fails (li-y31rgl)", () => {
    const dir = makeFixture({
      "src/domain/shared.ts": RESULT_PRELUDE,
      "src/domain/nested.ts":
        'import type { DomainError, Result } from "./shared";\n' +
        "export function risky(): Result<number, DomainError> {\n" +
        "  try {\n" +
        "    return { ok: true, value: 1 };\n" +
        "  } catch {\n" +
        "    function later(): void {\n" +
        '      throw new Error("nested");\n' +
        "    }\n" +
        "    void later;\n" +
        '    return { ok: false, error: { kind: "parse-error", detail: "swallowed" } };\n' +
        "  }\n" +
        "}\n",
    });
    const { exitCode, output } = runResult(dir);
    expect(exitCode).toBe(1);
    expect(output).toContain("src/domain/nested.ts");
    expect(output).toContain("catch");
  }, 60000);

  test("a catch clause outside approved adapters that does not rethrow fails", () => {
    const dir = makeFixture({
      "src/domain/shared.ts": RESULT_PRELUDE,
      "src/domain/sneaky.ts":
        'import type { DomainError, Result } from "./shared";\n' +
        "export function risky(): Result<number, DomainError> {\n" +
        "  try {\n" +
        "    return { ok: true, value: 1 };\n" +
        "  } catch {\n" +
        '    return { ok: false, error: { kind: "parse-error", detail: "hidden bug" } };\n' +
        "  }\n" +
        "}\n",
    });
    const { exitCode, output } = runResult(dir);
    expect(exitCode).toBe(1);
    expect(output).toContain("src/domain/sneaky.ts");
    expect(output).toContain("catch");
  }, 60000);

  test("a rethrowing catch outside adapters and a classifying catch inside adapters both pass", () => {
    const dir = makeFixture({
      "src/domain/shared.ts": RESULT_PRELUDE,
      "src/domain/supervised.ts":
        'import type { DomainError, Result } from "./shared";\n' +
        "export function safe(): Result<number, DomainError> {\n" +
        "  try {\n" +
        "    return { ok: true, value: 1 };\n" +
        "  } catch (bug) {\n" +
        "    throw bug;\n" +
        "  }\n" +
        "}\n",
      "src/adapters/shared.ts": RESULT_PRELUDE,
      "src/adapters/net.ts":
        'import type { DomainError, Result } from "./shared";\n' +
        "export async function get(): Promise<Result<string, DomainError>> {\n" +
        "  try {\n" +
        '    return { ok: true, value: "body" };\n' +
        "  } catch {\n" +
        '    return { ok: false, error: { kind: "parse-error", detail: "network" } };\n' +
        "  }\n" +
        "}\n",
    });
    const { exitCode, output } = runResult(dir);
    expect(output).not.toContain("FAIL");
    expect(exitCode).toBe(0);
  }, 60000);

  test("throwing a DomainError-typed value fails", () => {
    const dir = makeFixture({
      "src/domain/shared.ts": RESULT_PRELUDE,
      "src/domain/thrower.ts":
        'import type { DomainError, Result } from "./shared";\n' +
        "export function boom(): Result<number, DomainError> {\n" +
        '  const error: DomainError = { kind: "parse-error", detail: "x" };\n' +
        "  throw error;\n" +
        "}\n",
    });
    const { exitCode, output } = runResult(dir);
    expect(exitCode).toBe(1);
    expect(output).toContain("DomainError");
    expect(output).toContain("throw");
  }, 60000);

  test("rendering a raw Error payload in a UI module fails", () => {
    const dir = makeFixture({
      "src/components/oops.ts":
        "export function render(error: Error): string {\n" +
        "  return error.message;\n" +
        "}\n",
    });
    const { exitCode, output } = runResult(dir);
    expect(exitCode).toBe(1);
    expect(output).toContain("src/components/oops.ts");
    expect(output).toContain("raw Error");
  }, 60000);

  test("an import resolving outside the repository fails (standalone boundary)", () => {
    const dir = makeFixture({
      "src/domain/escape.ts":
        'import { fleet } from "../../../../livespec/tooling";\n' +
        'export const marker: number = typeof fleet === "number" ? fleet : 0;\n',
    });
    const { exitCode, output } = runResult(dir);
    expect(exitCode).toBe(1);
    expect(output).toContain("outside the repository");
  }, 60000);

  test("a src/lib core export not returning Result fails (selected $lib core dir)", () => {
    // The phase-1 SvelteKit `$lib` layout places core logic under src/lib/**;
    // scenario-coverage.json maps the phase-1 core tests to
    // src/lib/{data,search,sort,markdown}. A raw (non-Result) core export there
    // must fail exactly as it does under the top-level core dirs — otherwise a
    // "result/rop discipline: ok" report would be weaker than the guardrail
    // requires (regression guard for the src/lib core-dir gap).
    const dir = makeFixture({
      "src/lib/data/load.ts":
        'export function loadResume(): string { return "ok"; }\n',
    });
    const { exitCode, output } = runResult(dir);
    expect(exitCode).toBe(1);
    expect(output).toContain("src/lib/data/load.ts");
    expect(output).toContain("Result");
  }, 60000);

  test("every selected $lib core dir enforces Result-returning exports", () => {
    const dir = makeFixture({
      "src/lib/search/projection.ts":
        "export function project(md: string): string {\n  return md;\n}\n",
      "src/lib/sort/section-sort.ts":
        "export const sortItems = (xs: number[]): number[] => xs;\n",
      "src/lib/markdown/render.ts":
        "export function render(md: string): string {\n  return md;\n}\n",
      "src/lib/domain/compose.ts":
        "export function compose(n: number): number {\n  return n;\n}\n",
    });
    const { exitCode, output } = runResult(dir);
    expect(exitCode).toBe(1);
    for (const path of [
      "src/lib/search/projection.ts",
      "src/lib/sort/section-sort.ts",
      "src/lib/markdown/render.ts",
      "src/lib/domain/compose.ts",
    ]) {
      expect(output).toContain(path);
    }
  }, 60000);

  test("a compliant src/lib core module returning Result passes", () => {
    const dir = makeFixture({
      "src/lib/data/shared.ts": RESULT_PRELUDE,
      "src/lib/data/load.ts":
        'import type { DomainError, Result } from "./shared";\n' +
        "export function loadResume(raw: string): Result<number, DomainError> {\n" +
        "  return { ok: true, value: raw.length };\n" +
        "}\n",
    });
    const { exitCode, output } = runResult(dir);
    expect(output).not.toContain("FAIL");
    expect(exitCode).toBe(0);
  }, 60000);

  test("a src/lib/server boundary export returning a bare (non-Promise) value fails", () => {
    const dir = makeFixture({
      "src/lib/server/shared.ts": RESULT_PRELUDE,
      "src/lib/server/read-source.ts":
        'import type { DomainError, Result } from "./shared";\n' +
        "export function readSource(): Result<string, DomainError> {\n" +
        '  return { ok: true, value: "x" };\n' +
        "}\n",
    });
    const { exitCode, output } = runResult(dir);
    expect(exitCode).toBe(1);
    expect(output).toContain("src/lib/server/read-source.ts");
    expect(output).toContain("AsyncResult");
  }, 60000);

  test("a src/lib/server boundary adapter may classify a caught failure without rethrowing", () => {
    const dir = makeFixture({
      "src/lib/server/shared.ts": RESULT_PRELUDE,
      "src/lib/server/read-source.ts":
        'import type { DomainError, Result } from "./shared";\n' +
        "export async function readSource(): Promise<Result<string, DomainError>> {\n" +
        "  try {\n" +
        '    return { ok: true, value: "body" };\n' +
        "  } catch {\n" +
        '    return { ok: false, error: { kind: "parse-error", detail: "io" } };\n' +
        "  }\n" +
        "}\n",
    });
    const { exitCode, output } = runResult(dir);
    expect(output).not.toContain("FAIL");
    expect(exitCode).toBe(0);
  }, 60000);

  test("a non-rethrowing catch in a src/lib core dir (not a boundary) fails", () => {
    const dir = makeFixture({
      "src/lib/data/shared.ts": RESULT_PRELUDE,
      "src/lib/data/parse.ts":
        'import type { DomainError, Result } from "./shared";\n' +
        "export function parse(): Result<number, DomainError> {\n" +
        "  try {\n" +
        "    return { ok: true, value: 1 };\n" +
        "  } catch {\n" +
        '    return { ok: false, error: { kind: "parse-error", detail: "hidden" } };\n' +
        "  }\n" +
        "}\n",
    });
    const { exitCode, output } = runResult(dir);
    expect(exitCode).toBe(1);
    expect(output).toContain("src/lib/data/parse.ts");
    expect(output).toContain("catch");
  }, 60000);

  test("the aggregate check runs the Result/ROP gate as operational", () => {
    const run = Bun.spawnSync({
      cmd: [
        "bun",
        join(repoRoot, "scripts", "check.ts"),
        "--project-root",
        repoRoot,
      ],
      cwd: repoRoot,
      env: {
        ...process.env,
        CHECK_SKIP_HARNESS_TESTS: "1",
        CHECK_SKIP_TOOLCHAIN_RUNNERS: "1",
        CHECK_SKIP_BUILD: "1",
        CHECK_SKIP_E2E: "1",
      },
    });
    const output = run.stdout.toString() + run.stderr.toString();
    const gateLine = output
      .split("\n")
      .find((line) => line.includes("result/rop enforcement"));
    expect(gateLine).toBeDefined();
    expect(gateLine).toContain("[ok]");
    expect(run.exitCode).toBe(0);
  }, 240000);
});
