// Verifies GitHub CI and pull-request automation per
// SPECIFICATION/non-functional-requirements.md §"GitHub CI and pull request
// discipline" and §"Pull request landing automation". Used in-process by the
// aggregate check (scripts/check.ts) and runnable standalone:
// bun scripts/check-ci.ts [--project-root <path>] [--live]
//
// Local verification (always):
// - .github/workflows/check.yml runs on pull_request -> master and
//   push -> master, checks out full history (fetch-depth: 0 — the TDD
//   branch-range validator must not see a shallow base), installs the
//   pinned Bun (setup-bun with a version/version-file pin), installs
//   dependencies from the lockfile (--frozen-lockfile), and runs
//   `bun run check`; every `bun run <script>` it invokes must be a named
//   package.json script (CI delegates, never embeds divergent logic).
// - .github/workflows/auto-enable-merge.yml triggers on the five required
//   pull_request event types, skips drafts and do-not-merge labels, limits
//   eligibility to the repository owner (or an explicit allowlist), mints a
//   short-lived GitHub App installation token (secrets APP_ID /
//   APP_PRIVATE_KEY), and enables rebase auto-merge via
//   `gh pr merge ... --auto --rebase`.
// - No workflow may implement an auto-update-branches mechanism.
// - .github/README.md documents the required status-check name, merge
//   methods, branch-protection/linear-history layout, non-strict policy,
//   the do-not-merge label, and the App secrets.
//
// Live verification (--live, or CHECK_LIVE_GITHUB=1 through the aggregate
// check): queries the GitHub API through `gh` for the actual repository
// settings — rebase-only merge methods, auto-merge enabled, and effective
// master branch rules (required "check" status, non-strict, linear
// history). The spec makes live verification optional-when-credentialed;
// local documented verification always runs.
//
// Exit codes per §"Exit-code baseline": 0 ok, 1 verification failure,
// 2 usage error, 3 precondition failure (.github/workflows missing, or
// --live without a working gh).

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

export const REQUIRED_STATUS_CONTEXT = "check";

const REQUIRED_AUTO_MERGE_EVENTS = [
  "opened",
  "reopened",
  "ready_for_review",
  "synchronize",
  "unlabeled",
] as const;

const GITHUB_DOC_PATH = ".github/README.md";

// The documentation must name each of these so the settings layout is
// reconstructible without GitHub access (spec: settings "documented").
const REQUIRED_DOC_MENTIONS: readonly [string, string][] = [
  ["`check`", "the required status-check name"],
  ["rebase", "the allowed merge method"],
  ["squash", "the disabled squash method"],
  ["linear history", "the linear-history requirement"],
  ["strict", "the non-strict required-checks policy"],
  ["APP_ID", "the GitHub App id secret"],
  ["APP_PRIVATE_KEY", "the GitHub App private-key secret"],
  ["do-not-merge", "the auto-merge opt-out label"],
];

export interface CiVerification {
  readonly status: "absent" | "fail" | "ok";
  readonly failures: readonly string[];
}

interface PackageJson {
  readonly scripts?: Record<string, string>;
}

interface WorkflowStep {
  readonly uses?: string;
  readonly run?: string;
  readonly with?: Record<string, unknown>;
}

interface Workflow {
  readonly on?: Record<string, unknown>;
  readonly jobs?: Record<
    string,
    { readonly if?: string; readonly steps?: WorkflowStep[] }
  >;
}

function parseWorkflow(path: string): Workflow | null {
  try {
    return Bun.YAML.parse(readFileSync(path, "utf8")) as Workflow;
  } catch {
    return null;
  }
}

function workflowSteps(workflow: Workflow): WorkflowStep[] {
  return Object.values(workflow.jobs ?? {}).flatMap((job) => job.steps ?? []);
}

function triggerBranches(workflow: Workflow, event: string): string[] {
  const trigger = (workflow.on ?? {})[event];
  if (trigger === null || typeof trigger !== "object") {
    return [];
  }
  const branches = (trigger as Record<string, unknown>)["branches"];
  return Array.isArray(branches) ? branches.map(String) : [];
}

function verifyCheckWorkflow(root: string, pkg: PackageJson): string[] {
  const path = join(root, ".github", "workflows", "check.yml");
  if (!existsSync(path)) {
    return [".github/workflows/check.yml is missing"];
  }
  const workflow = parseWorkflow(path);
  if (workflow === null) {
    return [".github/workflows/check.yml is not parseable YAML"];
  }
  const failures: string[] = [];
  if (!triggerBranches(workflow, "pull_request").includes("master")) {
    failures.push("check.yml must run on pull_request events targeting master");
  }
  if (!triggerBranches(workflow, "push").includes("master")) {
    failures.push("check.yml must run on push events to master");
  }
  const steps = workflowSteps(workflow);
  const checkout = steps.find((s) =>
    (s.uses ?? "").includes("actions/checkout"),
  );
  if (checkout?.with?.["fetch-depth"] !== 0) {
    failures.push(
      "check.yml must check out full history (fetch-depth: 0) so the TDD branch-range base is resolvable",
    );
  }
  const setupBun = steps.find((s) => (s.uses ?? "").includes("setup-bun"));
  if (
    setupBun === undefined ||
    (setupBun.with?.["bun-version"] === undefined &&
      setupBun.with?.["bun-version-file"] === undefined)
  ) {
    failures.push(
      "check.yml must install the pinned Bun toolchain (setup-bun with bun-version or bun-version-file)",
    );
  }
  const runLines = steps.map((s) => s.run ?? "").filter((r) => r.length > 0);
  if (!runLines.some((r) => r.includes("bun install --frozen-lockfile"))) {
    failures.push(
      "check.yml must install dependencies from the lockfile (bun install --frozen-lockfile)",
    );
  }
  if (!runLines.some((r) => /bun run check\b/.test(r))) {
    failures.push("check.yml must run the aggregate check (bun run check)");
  }
  const scripts = pkg.scripts ?? {};
  for (const runLine of runLines) {
    for (const match of runLine.matchAll(/bun run ([A-Za-z0-9:_-]+)/g)) {
      const script = match[1] ?? "";
      if (!(script in scripts)) {
        failures.push(
          `check.yml must delegate to named package scripts; "bun run ${script}" is not a package.json script`,
        );
      }
    }
  }
  return failures;
}

function verifyAutoMergeWorkflow(root: string): string[] {
  const path = join(root, ".github", "workflows", "auto-enable-merge.yml");
  if (!existsSync(path)) {
    return [".github/workflows/auto-enable-merge.yml is missing"];
  }
  const workflow = parseWorkflow(path);
  if (workflow === null) {
    return [".github/workflows/auto-enable-merge.yml is not parseable YAML"];
  }
  const failures: string[] = [];
  const raw = readFileSync(path, "utf8");
  const trigger = (workflow.on ?? {})["pull_request"];
  const types =
    trigger !== null && typeof trigger === "object"
      ? (trigger as Record<string, unknown>)["types"]
      : undefined;
  const typeList = Array.isArray(types) ? types.map(String) : [];
  for (const event of REQUIRED_AUTO_MERGE_EVENTS) {
    if (!typeList.includes(event)) {
      failures.push(
        `auto-enable-merge.yml must trigger on pull_request type "${event}"`,
      );
    }
  }
  if (!raw.includes("draft == false")) {
    failures.push("auto-enable-merge.yml must skip draft pull requests");
  }
  if (!raw.includes("do-not-merge")) {
    failures.push(
      "auto-enable-merge.yml must skip pull requests labeled do-not-merge",
    );
  }
  if (!raw.includes("github.repository_owner")) {
    failures.push(
      "auto-enable-merge.yml must limit eligibility to the repository owner or an explicit allowlist",
    );
  }
  const usesAppToken = workflowSteps(workflow).some((s) =>
    (s.uses ?? "").includes("actions/create-github-app-token"),
  );
  if (
    !usesAppToken ||
    !raw.includes("secrets.APP_ID") ||
    !raw.includes("secrets.APP_PRIVATE_KEY")
  ) {
    failures.push(
      "auto-enable-merge.yml must mint a short-lived GitHub App installation token (actions/create-github-app-token with secrets.APP_ID / secrets.APP_PRIVATE_KEY), not GITHUB_TOKEN",
    );
  }
  if (!raw.includes("gh pr merge") || !raw.includes("--auto --rebase")) {
    failures.push(
      "auto-enable-merge.yml must enable rebase auto-merge via gh pr merge --auto --rebase",
    );
  }
  return failures;
}

function verifyNoBranchUpdater(root: string): string[] {
  const dir = join(root, ".github", "workflows");
  const failures: string[] = [];
  for (const name of readdirSync(dir)) {
    const raw = readFileSync(join(dir, name), "utf8");
    if (raw.includes("update-branch") || raw.includes("update_branch")) {
      failures.push(
        `.github/workflows/${name} implements a prohibited auto-update-branches mechanism (behind PRs are handled by rebase auto-merge at merge time)`,
      );
    }
  }
  return failures;
}

function verifyDocumentation(root: string): string[] {
  const path = join(root, GITHUB_DOC_PATH);
  if (!existsSync(path)) {
    return [
      `${GITHUB_DOC_PATH} is missing — the required status-check name and branch-protection/merge-method settings must be documented`,
    ];
  }
  const doc = readFileSync(path, "utf8");
  const failures: string[] = [];
  for (const [needle, what] of REQUIRED_DOC_MENTIONS) {
    if (!doc.includes(needle)) {
      failures.push(`${GITHUB_DOC_PATH} must document ${what} ("${needle}")`);
    }
  }
  return failures;
}

export function verifyCiProvisioning(root: string): CiVerification {
  if (!existsSync(join(root, ".github", "workflows"))) {
    return { status: "absent", failures: [] };
  }
  const packageJsonPath = join(root, "package.json");
  const pkg: PackageJson = existsSync(packageJsonPath)
    ? (JSON.parse(readFileSync(packageJsonPath, "utf8")) as PackageJson)
    : {};
  const failures = [
    ...verifyCheckWorkflow(root, pkg),
    ...verifyAutoMergeWorkflow(root),
    ...verifyNoBranchUpdater(root),
    ...verifyDocumentation(root),
  ];
  return failures.length > 0
    ? { status: "fail", failures }
    : { status: "ok", failures: [] };
}

interface GhResult {
  readonly exitCode: number | null;
  readonly stdout: string;
  readonly stderr: string;
}

function gh(root: string, ...args: readonly string[]): GhResult {
  const run = Bun.spawnSync({ cmd: ["gh", ...args], cwd: root });
  return {
    exitCode: run.exitCode,
    stdout: run.stdout.toString(),
    stderr: run.stderr.toString(),
  };
}

// Live settings verification through the GitHub API. Fails actionably when
// required branch protection, linear history, the required aggregate-check
// status, or the merge-method settings are absent or misconfigured.
export function verifyLiveGitHubSettings(root: string): string[] {
  const repoRes = gh(root, "api", "repos/{owner}/{repo}");
  if (repoRes.exitCode !== 0) {
    return [
      `live verification could not query the repository via gh: ${repoRes.stderr.trim().split("\n")[0] ?? "unknown error"}`,
    ];
  }
  const failures: string[] = [];
  const repo = JSON.parse(repoRes.stdout) as Record<string, unknown>;
  const settings: readonly [string, boolean, string][] = [
    ["allow_rebase_merge", true, "rebase merge must be allowed"],
    ["allow_squash_merge", false, "squash merge must be disabled"],
    ["allow_merge_commit", false, "merge commits must be disabled"],
    ["allow_auto_merge", true, "pull-request auto-merge must be enabled"],
  ];
  for (const [key, expected, what] of settings) {
    if (repo[key] !== expected) {
      failures.push(`${what} (${key} is ${String(repo[key])})`);
    }
  }
  // Ruleset-derived rules (the /rules endpoint does NOT surface classic
  // branch protection, so both sources are consulted).
  const rulesRes = gh(
    root,
    "api",
    "repos/{owner}/{repo}/rules/branches/master",
  );
  const rules =
    rulesRes.exitCode === 0
      ? (JSON.parse(rulesRes.stdout) as {
          type: string;
          parameters?: Record<string, unknown>;
        }[])
      : [];
  const protectionRes = gh(
    root,
    "api",
    "repos/{owner}/{repo}/branches/master/protection",
  );
  const protection =
    protectionRes.exitCode === 0
      ? (JSON.parse(protectionRes.stdout) as {
          required_status_checks?: { strict?: boolean; contexts?: string[] };
          required_linear_history?: { enabled?: boolean };
        })
      : {};
  const linearViaRuleset = rules.some(
    (rule) => rule.type === "required_linear_history",
  );
  if (
    !linearViaRuleset &&
    protection.required_linear_history?.enabled !== true
  ) {
    failures.push(
      "master must require linear history (neither a ruleset rule nor classic branch protection enables it)",
    );
  }
  // Linear history must bind administrators: a no-bypass ruleset is the
  // documented mechanism (classic protection with enforce_admins off does
  // not apply to admins).
  if (!linearViaRuleset) {
    failures.push(
      "linear history must apply to administrators via a no-bypass ruleset (see .github/README.md)",
    );
  }
  const statusRule = rules.find(
    (rule) => rule.type === "required_status_checks",
  );
  const rulesetContexts = (
    (statusRule?.parameters?.["required_status_checks"] as
      { context?: string }[] | undefined) ?? []
  ).map((entry) => entry.context ?? "");
  const contexts = [
    ...(protection.required_status_checks?.contexts ?? []),
    ...rulesetContexts,
  ];
  if (!contexts.includes(REQUIRED_STATUS_CONTEXT)) {
    failures.push(
      `master branch protection must require the "${REQUIRED_STATUS_CONTEXT}" status check before merge`,
    );
  }
  if (
    protection.required_status_checks?.strict === true ||
    statusRule?.parameters?.["strict_required_status_checks_policy"] === true
  ) {
    failures.push(
      "required status checks must NOT use strict mode (it breaks rebase auto-merge linear history)",
    );
  }
  return failures;
}

if (import.meta.main) {
  let root = process.cwd();
  let live = false;
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--live") {
      live = true;
    } else if (arg === "--project-root") {
      const value = argv[i + 1];
      if (value === undefined) {
        console.error(
          "usage: bun scripts/check-ci.ts [--project-root <path>] [--live]",
        );
        process.exit(2);
      }
      root = resolve(value);
      i += 1;
    } else {
      console.error(
        "usage: bun scripts/check-ci.ts [--project-root <path>] [--live]",
      );
      process.exit(2);
    }
  }
  const result = verifyCiProvisioning(root);
  if (result.status === "absent") {
    console.error(
      "precondition failure: .github/workflows/ is missing — CI provisioning has not landed in this tree",
    );
    process.exit(3);
  }
  const failures = [...result.failures];
  if (live) {
    failures.push(...verifyLiveGitHubSettings(root));
  }
  if (failures.length > 0) {
    console.error(
      `github ci/pr automation: FAIL — ${String(failures.length)} problem(s):`,
    );
    for (const failure of failures) {
      console.error(`  - ${failure}`);
    }
    process.exit(1);
  }
  console.log(
    `github ci/pr automation: ok (workflows, delegation, documentation${live ? ", live settings" : ""}).`,
  );
}
