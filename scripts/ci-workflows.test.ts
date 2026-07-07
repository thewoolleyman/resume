// Harness test for GitHub CI and pull-request automation (work item
// li-xjjeqo; plan/guardrail/research/findings.md slice 6).
//
// Pins SPECIFICATION/non-functional-requirements.md §"GitHub CI and pull
// request discipline" and §"Pull request landing automation":
// .github/workflows/check.yml runs `bun run check` on pull requests
// targeting master and pushes to master with the pinned Bun toolchain, a
// lockfile install, and a full-history checkout (the TDD range validator
// must not see a shallow base); CI delegates to named Bun scripts only;
// .github/workflows/auto-enable-merge.yml enables rebase auto-merge for
// eligible owner PRs via a short-lived GitHub App token (APP_ID /
// APP_PRIVATE_KEY), skipping drafts and do-not-merge labels; no
// auto-update-branches mechanism exists; and the required status-check
// name, merge-method, and branch-protection settings are documented and
// locally verified by scripts/check-ci.ts inside `bun run check`.

import { afterAll, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const repoRoot = join(import.meta.dir, "..");
const ciScript = join(repoRoot, "scripts", "check-ci.ts");

const fixtures: string[] = [];
afterAll(() => {
  for (const dir of fixtures) {
    rmSync(dir, { recursive: true, force: true });
  }
});

const VALID_CHECK_YML = `name: check
on:
  pull_request:
    branches: [master]
  push:
    branches: [master]
jobs:
  check:
    name: check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version-file: package.json
      - run: bun install --frozen-lockfile
      - run: bun run check
`;

const VALID_AUTO_MERGE_YML = `name: auto-enable-merge
on:
  pull_request:
    types: [opened, reopened, ready_for_review, synchronize, unlabeled]
jobs:
  enable-auto-merge:
    if: >-
      github.event.pull_request.draft == false &&
      !contains(github.event.pull_request.labels.*.name, 'do-not-merge') &&
      github.event.pull_request.user.login == github.repository_owner
    runs-on: ubuntu-latest
    steps:
      - id: app-token
        uses: actions/create-github-app-token@v1
        with:
          app-id: \${{ secrets.APP_ID }}
          private-key: \${{ secrets.APP_PRIVATE_KEY }}
      - env:
          GH_TOKEN: \${{ steps.app-token.outputs.token }}
          PR: \${{ github.event.pull_request.number }}
          REPO: \${{ github.repository }}
        run: gh pr merge "$PR" --repo "$REPO" --auto --rebase
`;

const VALID_GITHUB_README = `# GitHub automation

Required status check: \`check\` (the check.yml job name); branch
protection must require it before auto-merge, with strict mode NOT
enabled. Merge methods: rebase only — squash and merge commits are
disabled; master requires linear history (applies to administrators via
a ruleset) while direct owner pushes stay permitted. Auto-merge needs
the APP_ID and APP_PRIVATE_KEY GitHub App secrets; PRs labeled
do-not-merge are skipped.
`;

interface FixtureOptions {
  readonly checkYml?: string | null;
  readonly autoMergeYml?: string | null;
  readonly readme?: string | null;
  readonly extraWorkflow?: { name: string; content: string };
  readonly withoutWorkflowsDir?: boolean;
}

function makeFixture(options: FixtureOptions = {}): string {
  const dir = mkdtempSync(join(tmpdir(), "resume-ci-fixture-"));
  fixtures.push(dir);
  writeFileSync(
    join(dir, "package.json"),
    JSON.stringify({
      name: "fixture",
      private: true,
      scripts: { check: "true" },
    }),
  );
  if (options.withoutWorkflowsDir) {
    return dir;
  }
  mkdirSync(join(dir, ".github", "workflows"), { recursive: true });
  const checkYml =
    options.checkYml === undefined ? VALID_CHECK_YML : options.checkYml;
  if (checkYml !== null) {
    writeFileSync(join(dir, ".github", "workflows", "check.yml"), checkYml);
  }
  const autoMergeYml =
    options.autoMergeYml === undefined
      ? VALID_AUTO_MERGE_YML
      : options.autoMergeYml;
  if (autoMergeYml !== null) {
    writeFileSync(
      join(dir, ".github", "workflows", "auto-enable-merge.yml"),
      autoMergeYml,
    );
  }
  const readme =
    options.readme === undefined ? VALID_GITHUB_README : options.readme;
  if (readme !== null) {
    writeFileSync(join(dir, ".github", "README.md"), readme);
  }
  if (options.extraWorkflow !== undefined) {
    writeFileSync(
      join(dir, ".github", "workflows", options.extraWorkflow.name),
      options.extraWorkflow.content,
    );
  }
  return dir;
}

function runCi(root: string): { exitCode: number | null; output: string } {
  const run = Bun.spawnSync({
    cmd: ["bun", ciScript, "--project-root", root],
    cwd: repoRoot,
  });
  return {
    exitCode: run.exitCode,
    output: run.stdout.toString() + run.stderr.toString(),
  };
}

describe("GitHub CI and pull-request automation gate (li-xjjeqo)", () => {
  test("the repository's committed workflows and docs pass local verification", () => {
    const { exitCode, output } = runCi(repoRoot);
    expect(output).not.toContain("FAIL");
    expect(exitCode).toBe(0);
  });

  test("a shape-valid fixture passes", () => {
    expect(runCi(makeFixture()).exitCode).toBe(0);
  });

  test("a missing workflows directory is a precondition failure (exit 3)", () => {
    expect(runCi(makeFixture({ withoutWorkflowsDir: true })).exitCode).toBe(3);
  });

  test("a missing check.yml fails, naming it", () => {
    const { exitCode, output } = runCi(makeFixture({ checkYml: null }));
    expect(exitCode).toBe(1);
    expect(output).toContain("check.yml");
  });

  test("check.yml without the push-to-master trigger fails", () => {
    const { exitCode, output } = runCi(
      makeFixture({
        checkYml: VALID_CHECK_YML.replace(
          "  push:\n    branches: [master]\n",
          "",
        ),
      }),
    );
    expect(exitCode).toBe(1);
    expect(output).toContain("push");
  });

  test("check.yml without a full-history checkout fails (shallow TDD range base)", () => {
    const { exitCode, output } = runCi(
      makeFixture({
        checkYml: VALID_CHECK_YML.replace(
          "        with:\n          fetch-depth: 0\n",
          "",
        ),
      }),
    );
    expect(exitCode).toBe(1);
    expect(output).toContain("fetch-depth");
  });

  test("check.yml without a pinned Bun setup fails", () => {
    const { exitCode, output } = runCi(
      makeFixture({
        checkYml: VALID_CHECK_YML.replace(
          "        with:\n          bun-version-file: package.json\n",
          "",
        ),
      }),
    );
    expect(exitCode).toBe(1);
    expect(output).toContain("setup-bun");
  });

  test("check.yml without the frozen-lockfile install fails", () => {
    const { exitCode, output } = runCi(
      makeFixture({
        checkYml: VALID_CHECK_YML.replace(
          "      - run: bun install --frozen-lockfile\n",
          "",
        ),
      }),
    );
    expect(exitCode).toBe(1);
    expect(output).toContain("frozen-lockfile");
  });

  test("a run step invoking a script that package.json does not name fails (delegation)", () => {
    const { exitCode, output } = runCi(
      makeFixture({
        checkYml: VALID_CHECK_YML.replace(
          "      - run: bun run check\n",
          "      - run: bun run check\n      - run: bun run mystery-gate\n",
        ),
      }),
    );
    expect(exitCode).toBe(1);
    expect(output).toContain("mystery-gate");
  });

  test("auto-enable-merge.yml missing the unlabeled trigger fails", () => {
    const { exitCode, output } = runCi(
      makeFixture({
        autoMergeYml: VALID_AUTO_MERGE_YML.replace(
          "types: [opened, reopened, ready_for_review, synchronize, unlabeled]",
          "types: [opened, reopened, ready_for_review, synchronize]",
        ),
      }),
    );
    expect(exitCode).toBe(1);
    expect(output).toContain("unlabeled");
  });

  test("auto-enable-merge.yml without the do-not-merge skip fails", () => {
    const { exitCode, output } = runCi(
      makeFixture({
        autoMergeYml: VALID_AUTO_MERGE_YML.replace(
          "      !contains(github.event.pull_request.labels.*.name, 'do-not-merge') &&\n",
          "",
        ),
      }),
    );
    expect(exitCode).toBe(1);
    expect(output).toContain("do-not-merge");
  });

  test("auto-enable-merge.yml without the GitHub App token mint fails", () => {
    const { exitCode, output } = runCi(
      makeFixture({
        autoMergeYml: VALID_AUTO_MERGE_YML.replace(
          "actions/create-github-app-token@v1",
          "nobody/some-other-action@v1",
        ),
      }),
    );
    expect(exitCode).toBe(1);
    expect(output).toContain("create-github-app-token");
  });

  test("auto-enable-merge.yml without rebase auto-merge enablement fails", () => {
    const { exitCode, output } = runCi(
      makeFixture({
        autoMergeYml: VALID_AUTO_MERGE_YML.replace(
          'run: gh pr merge "$PR" --repo "$REPO" --auto --rebase',
          'run: echo "$PR"',
        ),
      }),
    );
    expect(exitCode).toBe(1);
    expect(output).toContain("--auto --rebase");
  });

  test("an auto-update-branches mechanism is rejected", () => {
    const { exitCode, output } = runCi(
      makeFixture({
        extraWorkflow: {
          name: "keep-branches-fresh.yml",
          content:
            "name: keep-branches-fresh\non:\n  push:\n    branches: [master]\njobs:\n  update:\n    runs-on: ubuntu-latest\n    steps:\n      - run: gh pr update-branch 1\n",
        },
      }),
    );
    expect(exitCode).toBe(1);
    expect(output).toContain("update-branch");
  });

  test("missing settings documentation fails, naming the doc", () => {
    const { exitCode, output } = runCi(makeFixture({ readme: null }));
    expect(exitCode).toBe(1);
    expect(output).toContain(".github/README.md");
  });

  test("documentation missing the App secrets fails", () => {
    const { exitCode, output } = runCi(
      makeFixture({
        readme: VALID_GITHUB_README.replace("APP_PRIVATE_KEY", "SOMETHING"),
      }),
    );
    expect(exitCode).toBe(1);
    expect(output).toContain("APP_PRIVATE_KEY");
  });

  test("the aggregate check runs the CI verification as an operational gate", () => {
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
      .find((line) => line.includes("ci delegation and workflow verification"));
    expect(gateLine).toBeDefined();
    expect(gateLine).toContain("[ok]");
    expect(run.exitCode).toBe(0);
  }, 240000);
});
