// Harness test for the Result/ROP enforcement gate (work item li-oaxjqm;
// plan/guardrail/research/findings.md slice 7).
//
// Pins SPECIFICATION/non-functional-requirements.md §"Result and
// railway-oriented programming discipline": first-party core modules
// (src/data|domain|search|grounding|mcp-contracts) expose Result-returning
// public functions; boundary modules (src/adapters|server|api) expose
// AsyncResult/Promise<Result>; Result return values may not be ignored;
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
  test("the repository passes with the discipline armed (no src/** yet) and the ESLint baseline verified", () => {
    const { exitCode, output } = runResult(repoRoot);
    expect(output).toContain("armed");
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
