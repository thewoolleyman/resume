// The Result/ROP enforcement gate — `bun run check:result` — per
// SPECIFICATION/non-functional-requirements.md §"Result and
// railway-oriented programming discipline". Standalone TypeScript AST
// checks (the TypeScript compiler API from the pinned devDependency; no
// external enforcement suite per constraints.md §"Standalone boundary")
// over first-party product source under src/**, plus verification that the
// type-aware ESLint rules the discipline leans on are effectively enabled.
//
// Layer split (the documented contract):
//   src/data|domain|search|grounding|mcp-contracts -> pure Result<T, DomainError>
//   src/adapters|server|api                        -> AsyncResult<T, DomainError>
//   src/routes|components                          -> unwrap Result, no raw errors
//
// Enforced checks:
// - Core exports declare Result-referencing return types; boundary exports
//   declare AsyncResult / Promise<Result<…>>.
// - No ignored Result return values: a bare/void-/paren-discarded
//   Result-typed call fails, and so does binding one to a variable that is
//   never read again (watcher fix li-y31rgl).
// - No floating promises and exhaustive DomainError.kind switches — via
//   type-aware ESLint (@typescript-eslint/no-floating-promises,
//   @typescript-eslint/switch-exhaustiveness-check), whose effective error
//   severity this gate verifies through eslint --print-config.
// - Catch clauses outside the approved boundary-adapter directories must
//   rethrow: a blanket catch that swallows would hide bugs as recoverable
//   failures. Boundary adapters may catch to classify expected failures.
// - DomainError is never thrown as an exception (it travels the Result
//   track; thrown exceptions are for bugs).
// - UI modules must not render raw Error payloads (.message / .stack);
//   visitor-facing errors derive from DomainError.kind via the
//   presentation mapper required by contracts.md §"Error payloads".
// - Standalone import boundary: src/** must not import modules that
//   resolve outside the repository (no sibling-checkout reach-through).
//
// With no src/** present the gate is ARMED: the AST checks are vacuous,
// the ESLint verification still runs, and the checks activate on the first
// product-source commit (additive provisioning, no bootstrap window).
//
// Exit codes per §"Exit-code baseline": 0 ok/armed, 1 violations, 2 usage
// error.

import { existsSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import ts from "typescript";

const CORE_DIRS = [
  "src/data",
  "src/domain",
  "src/search",
  "src/grounding",
  "src/mcp-contracts",
] as const;

const BOUNDARY_DIRS = ["src/adapters", "src/server", "src/api"] as const;

const UI_DIRS = ["src/routes", "src/components"] as const;

// Boundary adapters (and future supervisors added here) are the only
// modules allowed to catch without rethrowing — they classify enumerated
// expected failures into DomainError variants.
const APPROVED_CATCH_DIRS: readonly string[] = BOUNDARY_DIRS;

const REQUIRED_ESLINT_RULES: readonly [string, string][] = [
  ["@typescript-eslint/no-floating-promises", "no floating promises"],
  [
    "@typescript-eslint/switch-exhaustiveness-check",
    "exhaustive switches over DomainError.kind",
  ],
];

interface Violation {
  readonly file: string;
  readonly line: number;
  readonly message: string;
}

function inDir(path: string, dirs: readonly string[]): boolean {
  return dirs.some((dir) => path.startsWith(`${dir}/`));
}

function collectSourceFiles(root: string, dir: string): string[] {
  const absolute = join(root, dir);
  if (!existsSync(absolute)) {
    return [];
  }
  const files: string[] = [];
  for (const entry of readdirSync(absolute, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) {
      continue;
    }
    const relPath = `${dir}/${entry.name}`;
    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(root, relPath));
    } else if (
      entry.name.endsWith(".ts") &&
      !entry.name.endsWith(".test.ts") &&
      !entry.name.endsWith(".spec.ts") &&
      !entry.name.endsWith(".d.ts")
    ) {
      files.push(relPath);
    }
  }
  return files;
}

function isExported(node: ts.HasModifiers): boolean {
  return (
    ts
      .getModifiers(node)
      ?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) ??
    false
  );
}

function returnTypeViolation(
  relPath: string,
  typeText: string | null,
  name: string,
): string | null {
  const core = inDir(relPath, CORE_DIRS);
  const boundary = inDir(relPath, BOUNDARY_DIRS);
  if (!core && !boundary) {
    return null;
  }
  if (typeText === null) {
    return `exported function "${name}" must declare a Result<T, DomainError> return type (first-party ${core ? "core" : "boundary"} module)`;
  }
  if (!typeText.includes("Result")) {
    return `exported function "${name}" must return Result<T, DomainError> (found "${typeText}")`;
  }
  if (
    boundary &&
    !typeText.includes("Promise") &&
    !typeText.includes("AsyncResult")
  ) {
    return `exported function "${name}" in a boundary module must return AsyncResult<T, DomainError> / Promise<Result<…>> (found "${typeText}")`;
  }
  return null;
}

// True only for a throw on the catch clause's own execution path: a throw
// inside a NESTED function or class body is deferred code, not a rethrow,
// so recursion stops at function/class boundaries (watcher fix li-y31rgl).
function containsThrow(node: ts.Node): boolean {
  if (ts.isThrowStatement(node)) {
    return true;
  }
  if (
    ts.isFunctionDeclaration(node) ||
    ts.isFunctionExpression(node) ||
    ts.isArrowFunction(node) ||
    ts.isMethodDeclaration(node) ||
    ts.isClassDeclaration(node) ||
    ts.isClassExpression(node)
  ) {
    return false;
  }
  let found = false;
  node.forEachChild((child) => {
    if (!found && containsThrow(child)) {
      found = true;
    }
  });
  return found;
}

// Peels await/void/parentheses off a discarded expression so `void f()` and
// `(f())` cannot smuggle a Result past the ignored-Result check.
function unwrapDiscard(expression: ts.Expression): ts.Expression {
  let current = expression;
  while (
    ts.isAwaitExpression(current) ||
    ts.isVoidExpression(current) ||
    ts.isParenthesizedExpression(current)
  ) {
    current = current.expression;
  }
  return current;
}

export function findResultViolations(
  root: string,
  relFiles: readonly string[],
): Violation[] {
  const violations: Violation[] = [];
  if (relFiles.length === 0) {
    return violations;
  }
  const program = ts.createProgram(
    relFiles.map((file) => join(root, file)),
    {
      strict: true,
      noEmit: true,
      skipLibCheck: true,
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
    },
  );
  const checker = program.getTypeChecker();

  for (const relPath of relFiles) {
    const sourceFile = program.getSourceFile(join(root, relPath));
    if (sourceFile === undefined) {
      continue;
    }
    const record = (node: ts.Node, message: string): void => {
      const { line } = sourceFile.getLineAndCharacterOfPosition(
        node.getStart(sourceFile),
      );
      violations.push({ file: relPath, line: line + 1, message });
    };

    // Result-typed variable bindings, checked after the walk: a binding
    // whose symbol is never referenced again discards the Result just as
    // surely as a bare expression statement (watcher fix li-y31rgl).
    const resultBindings: {
      declaration: ts.VariableDeclaration;
      symbol: ts.Symbol;
      typeText: string;
      exported: boolean;
    }[] = [];
    const referencedSymbols = new Set<ts.Symbol>();

    const visit = (node: ts.Node): void => {
      // Exported function declarations in core/boundary modules.
      if (ts.isFunctionDeclaration(node) && isExported(node)) {
        const message = returnTypeViolation(
          relPath,
          node.type?.getText(sourceFile) ?? null,
          node.name?.getText(sourceFile) ?? "(anonymous)",
        );
        if (message !== null) {
          record(node, message);
        }
      }
      // Exported const arrow/function-expression bindings.
      if (ts.isVariableStatement(node) && isExported(node)) {
        for (const declaration of node.declarationList.declarations) {
          const initializer = declaration.initializer;
          if (
            initializer !== undefined &&
            (ts.isArrowFunction(initializer) ||
              ts.isFunctionExpression(initializer))
          ) {
            const typeText =
              declaration.type?.getText(sourceFile) ??
              initializer.type?.getText(sourceFile) ??
              null;
            const message = returnTypeViolation(
              relPath,
              typeText,
              declaration.name.getText(sourceFile),
            );
            if (message !== null) {
              record(declaration, message);
            }
          }
        }
      }
      // Ignored Result return values — bare, void-, or paren-discarded.
      if (ts.isExpressionStatement(node)) {
        const expression = unwrapDiscard(node.expression);
        if (ts.isCallExpression(expression)) {
          const typeText = checker.typeToString(
            checker.getTypeAtLocation(expression),
          );
          if (/\bResult</.test(typeText)) {
            record(
              node,
              `ignored Result return value (${typeText}) — handle both variants or propagate it`,
            );
          }
        }
      }
      // Ignored Result return values — bound to a variable: collect the
      // binding here, decide after the walk whether it is ever read.
      if (
        ts.isVariableDeclaration(node) &&
        ts.isIdentifier(node.name) &&
        node.initializer !== undefined
      ) {
        const initializer = unwrapDiscard(node.initializer);
        if (ts.isCallExpression(initializer)) {
          const typeText = checker.typeToString(
            checker.getTypeAtLocation(initializer),
          );
          const symbol = checker.getSymbolAtLocation(node.name);
          if (/\bResult</.test(typeText) && symbol !== undefined) {
            const statement = node.parent.parent;
            resultBindings.push({
              declaration: node,
              symbol,
              typeText,
              exported:
                ts.isVariableStatement(statement) && isExported(statement),
            });
          }
        }
      }
      // Track identifier references so never-read bindings surface. The
      // declaration's own name node is excluded; shorthand properties
      // resolve to the value symbol they reference.
      if (
        ts.isIdentifier(node) &&
        !(ts.isVariableDeclaration(node.parent) && node.parent.name === node)
      ) {
        const symbol = ts.isShorthandPropertyAssignment(node.parent)
          ? checker.getShorthandAssignmentValueSymbol(node.parent)
          : checker.getSymbolAtLocation(node);
        if (symbol !== undefined) {
          referencedSymbols.add(symbol);
        }
      }
      // Blanket catch outside approved boundary adapters.
      if (
        ts.isCatchClause(node) &&
        !inDir(relPath, APPROVED_CATCH_DIRS) &&
        !containsThrow(node.block)
      ) {
        record(
          node,
          "catch clause outside approved boundary adapters must rethrow — a blanket catch hides bugs as recoverable failures",
        );
      }
      // DomainError thrown as an exception.
      if (ts.isThrowStatement(node)) {
        const typeText = checker.typeToString(
          checker.getTypeAtLocation(node.expression),
        );
        if (typeText.includes("DomainError")) {
          record(
            node,
            "DomainError must not be thrown — expected failures travel the Result track; throw only for bugs",
          );
        }
      }
      // Raw Error payload rendering in UI modules.
      if (
        ts.isPropertyAccessExpression(node) &&
        inDir(relPath, UI_DIRS) &&
        (node.name.text === "message" || node.name.text === "stack")
      ) {
        const typeText = checker.typeToString(
          checker.getTypeAtLocation(node.expression),
        );
        if (typeText.includes("Error") && !typeText.includes("DomainError")) {
          record(
            node,
            `raw Error payloads must not be rendered to visitors (derive the message from DomainError.kind via the presentation mapper; found .${node.name.text} on ${typeText})`,
          );
        }
      }
      // Standalone import boundary: no imports resolving outside the repo.
      if (
        ts.isImportDeclaration(node) &&
        ts.isStringLiteral(node.moduleSpecifier)
      ) {
        const specifier = node.moduleSpecifier.text;
        if (specifier.startsWith(".")) {
          const resolved = resolve(join(root, dirname(relPath)), specifier);
          if (relative(root, resolved).startsWith("..")) {
            record(
              node,
              `import "${specifier}" resolves outside the repository — the standalone boundary forbids sibling-checkout dependencies`,
            );
          }
        }
      }
      node.forEachChild(visit);
    };
    visit(sourceFile);
    for (const binding of resultBindings) {
      if (!binding.exported && !referencedSymbols.has(binding.symbol)) {
        record(
          binding.declaration,
          `ignored Result return value (${binding.typeText}) — bound to the never-read variable "${binding.declaration.name.getText(sourceFile)}"`,
        );
      }
    }
  }
  return violations;
}

function isErrorSeverity(entry: unknown): boolean {
  const severity = Array.isArray(entry) ? (entry as unknown[])[0] : entry;
  return severity === 2 || severity === "error";
}

// Effective-enablement verification for the type-aware ESLint rules this
// discipline delegates to (same --print-config approach as the toolchain
// baseline gate, so a later flat-config block cannot disable them
// silently).
function verifyEslintResultRules(root: string): string[] {
  if (!existsSync(join(root, "eslint.config.js"))) {
    return [];
  }
  const run = Bun.spawnSync({
    cmd: ["bunx", "eslint", "--print-config", "eslint-baseline-probe.ts"],
    cwd: root,
  });
  if (run.exitCode !== 0) {
    return ["eslint --print-config failed while verifying the Result rules"];
  }
  let rules: Record<string, unknown>;
  try {
    const parsed = JSON.parse(run.stdout.toString()) as {
      rules?: Record<string, unknown>;
    };
    rules = parsed.rules ?? {};
  } catch {
    return ["eslint --print-config emitted unparseable output"];
  }
  const failures: string[] = [];
  for (const [rule, what] of REQUIRED_ESLINT_RULES) {
    if (!isErrorSeverity(rules[rule])) {
      failures.push(
        `effective ESLint config must enable "${rule}" at error severity (${what})`,
      );
    }
  }
  return failures;
}

if (import.meta.main) {
  let root = process.cwd();
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--project-root") {
      const value = argv[i + 1];
      if (value === undefined) {
        console.error(
          "usage: bun scripts/check-result.ts [--project-root <path>]",
        );
        process.exit(2);
      }
      root = resolve(value);
      i += 1;
    } else {
      console.error(
        "usage: bun scripts/check-result.ts [--project-root <path>]",
      );
      process.exit(2);
    }
  }
  const files = collectSourceFiles(root, "src");
  const violations = findResultViolations(root, files);
  const eslintFailures = verifyEslintResultRules(root);
  if (violations.length > 0 || eslintFailures.length > 0) {
    console.error(
      `result/rop discipline: FAIL — ${String(violations.length + eslintFailures.length)} problem(s):`,
    );
    for (const violation of violations) {
      console.error(
        `  - ${violation.file}:${String(violation.line)} — ${violation.message}`,
      );
    }
    for (const failure of eslintFailures) {
      console.error(`  - ${failure}`);
    }
    process.exit(1);
  }
  if (files.length === 0) {
    console.log(
      "result/rop discipline: armed — no first-party src/** product source yet; ESLint result rules verified, AST checks activate with the first product commit.",
    );
  } else {
    console.log(
      `result/rop discipline: ok (${String(files.length)} first-party source file(s) verified).`,
    );
  }
}
