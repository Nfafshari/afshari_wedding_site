import { readdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import ts from "typescript";

/**
 * Structural auth checks: they read the source (never run it) and fail when a rule the
 * planner's security depends on stops being true. Clicking through the app can't catch
 * these: a Server Action with no guard works fine, for everyone.
 *
 * See "Auth" in docs/standards.md.
 */

// ---------------------------------------------------------------------------------
// Deliberately public. Adding to either list is a security decision: justify it in
// the PR. A stale entry (file renamed or deleted) fails the sanity tests below.
// ---------------------------------------------------------------------------------

/** "use server" files whose actions are intentionally callable while signed out. */
const PUBLIC_ACTION_FILES = [
  "src/app/sign-in/action.ts", // you can't require a login to log in
  "src/app/sign-out/action.ts",
];

/** Route handlers that are intentionally public. */
const PUBLIC_ROUTE_FILES = [
  "src/app/api/auth/[...nextauth]/route.ts", // Auth.js's own sign-in/callback endpoints
];

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const PLANNER_DIR = "src/app/(protected)/planner";

// ---------------------------------------------------------------------------------
// Source helpers
// ---------------------------------------------------------------------------------

function toRelative(absolutePath: string): string {
  return path.relative(ROOT, absolutePath).split(path.sep).join("/");
}

function walk(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // generated/ is machine-written Prisma output, not ours to police.
      if (entry.name !== "generated") found.push(...walk(full));
    } else {
      found.push(full);
    }
  }
  return found;
}

const SOURCE_FILES = walk(path.join(ROOT, "src"))
  .map(toRelative)
  .filter((file) => /\.(ts|tsx)$/.test(file) && !file.endsWith(".d.ts"))
  .sort();

function parse(relativePath: string): ts.SourceFile {
  const kind = relativePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const text = readFileSync(path.join(ROOT, relativePath), "utf8");
  return ts.createSourceFile(relativePath, text, ts.ScriptTarget.Latest, true, kind);
}

/**
 * True only for a real `"use server"` directive at the top of the file. A text search
 * would also match the phrase inside a comment (doc-archive/data.ts does).
 */
function hasUseServerDirective(sf: ts.SourceFile): boolean {
  for (const statement of sf.statements) {
    if (!ts.isExpressionStatement(statement) || !ts.isStringLiteral(statement.expression)) {
      return false;
    }
    if (statement.expression.text === "use server") return true;
  }
  return false;
}

function hasModifier(node: ts.Node, kind: ts.SyntaxKind): boolean {
  const modifiers = ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined;
  return modifiers?.some((modifier) => modifier.kind === kind) ?? false;
}

type ExportedItem = {
  name: string;
  isDefault: boolean;
  isFunction: boolean;
  isAsync: boolean;
  body: ts.ConciseBody | undefined;
};

/**
 * Lists a file's runtime exports. Anything it can't classify goes in `unsupported`
 * rather than being skipped: an export form this test doesn't understand could be an
 * unguarded action, so it must fail loudly.
 */
function listExports(sf: ts.SourceFile): { items: ExportedItem[]; unsupported: string[] } {
  const items: ExportedItem[] = [];
  const unsupported: string[] = [];

  for (const statement of sf.statements) {
    if (ts.isTypeAliasDeclaration(statement) || ts.isInterfaceDeclaration(statement)) {
      continue; // erased at compile time
    }

    if (ts.isExportDeclaration(statement)) {
      if (!statement.isTypeOnly) unsupported.push(statement.getText(sf));
      continue;
    }

    if (ts.isExportAssignment(statement)) {
      items.push({ name: "default", isDefault: true, isFunction: false, isAsync: false, body: undefined });
      continue;
    }

    if (!hasModifier(statement, ts.SyntaxKind.ExportKeyword)) continue;

    if (ts.isFunctionDeclaration(statement)) {
      items.push({
        name: statement.name?.text ?? "default",
        isDefault: hasModifier(statement, ts.SyntaxKind.DefaultKeyword),
        isFunction: true,
        isAsync: hasModifier(statement, ts.SyntaxKind.AsyncKeyword),
        body: statement.body,
      });
    } else if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        const init = declaration.initializer;
        const isFn = !!init && (ts.isArrowFunction(init) || ts.isFunctionExpression(init));
        items.push({
          name: declaration.name.getText(sf),
          isDefault: false,
          isFunction: isFn,
          isAsync: isFn && hasModifier(init, ts.SyntaxKind.AsyncKeyword),
          body: isFn ? init.body : undefined,
        });
      }
    } else {
      unsupported.push(statement.getText(sf).split("\n")[0]);
    }
  }

  return { items, unsupported };
}

/** `await fn()` -> true when the awaited call is to the identifier `calleeName`. */
function isAwaitedCallTo(expression: ts.Expression | undefined, calleeName: string): boolean {
  return (
    !!expression &&
    ts.isAwaitExpression(expression) &&
    ts.isCallExpression(expression.expression) &&
    ts.isIdentifier(expression.expression.expression) &&
    expression.expression.expression.text === calleeName
  );
}

function blockStatements(body: ts.ConciseBody | undefined): readonly ts.Statement[] | null {
  return body && ts.isBlock(body) ? body.statements : null;
}

// ---------------------------------------------------------------------------------
// Rules. Each returns a human-readable problem, or null when the rule holds.
// ---------------------------------------------------------------------------------

/**
 * A Server Action must open with:
 *   const guard = await requireUserAction();
 *   if (!guard.ok) { return guard; }
 * Checking the `if` too matters: a bare `await requireUserAction();` ignores the
 * result, so it would look guarded while letting everyone through.
 */
function actionGuardProblem(item: ExportedItem): string | null {
  if (!item.isFunction) {
    return 'is not a function; a "use server" file may only export async functions';
  }
  if (!item.isAsync) return "is not async";

  const statements = blockStatements(item.body);
  if (!statements) return "has no block body to start with the guard";

  const [first, second] = statements;
  if (
    !first ||
    !ts.isVariableStatement(first) ||
    first.declarationList.declarations.length !== 1 ||
    !ts.isIdentifier(first.declarationList.declarations[0].name) ||
    !isAwaitedCallTo(first.declarationList.declarations[0].initializer, "requireUserAction")
  ) {
    return "must start with `const guard = await requireUserAction();`";
  }

  const guardName = (first.declarationList.declarations[0].name as ts.Identifier).text;
  const isOkCheck =
    !!second &&
    ts.isIfStatement(second) &&
    ts.isPrefixUnaryExpression(second.expression) &&
    second.expression.operator === ts.SyntaxKind.ExclamationToken &&
    ts.isPropertyAccessExpression(second.expression.operand) &&
    ts.isIdentifier(second.expression.operand.expression) &&
    second.expression.operand.expression.text === guardName &&
    second.expression.operand.name.text === "ok";

  if (!isOkCheck) {
    return `must follow the guard with \`if (!${guardName}.ok) { return ${guardName}; }\``;
  }

  const thenBranch = second.thenStatement;
  const returns =
    ts.isReturnStatement(thenBranch) ||
    (ts.isBlock(thenBranch) && thenBranch.statements.some(ts.isReturnStatement));

  return returns ? null : `the \`if (!${guardName}.ok)\` branch must return`;
}

/** A planner data fetcher / layout must call `requireUser()` as its first statement. */
function requireUserProblem(item: ExportedItem): string | null {
  const first = blockStatements(item.body)?.[0];
  const call = !first
    ? undefined
    : ts.isExpressionStatement(first)
      ? first.expression
      : ts.isVariableStatement(first) && first.declarationList.declarations.length === 1
        ? first.declarationList.declarations[0].initializer
        : undefined;

  return isAwaitedCallTo(call, "requireUser") ? null : "must start with `await requireUser();`";
}

/** Reads `config.matcher` from proxy.ts. */
function readProxy(): { hasDefaultExport: boolean; matchers: string[] } {
  const sf = parse("src/proxy.ts");
  const { items } = listExports(sf);
  const matchers: string[] = [];

  for (const statement of sf.statements) {
    if (!ts.isVariableStatement(statement) || !hasModifier(statement, ts.SyntaxKind.ExportKeyword)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (declaration.name.getText(sf) !== "config" || !declaration.initializer) continue;
      if (!ts.isObjectLiteralExpression(declaration.initializer)) continue;
      for (const property of declaration.initializer.properties) {
        if (
          ts.isPropertyAssignment(property) &&
          property.name.getText(sf) === "matcher" &&
          ts.isArrayLiteralExpression(property.initializer)
        ) {
          for (const element of property.initializer.elements) {
            if (ts.isStringLiteralLike(element)) matchers.push(element.text);
          }
        }
      }
    }
  }

  return { hasDefaultExport: items.some((item) => item.isDefault), matchers };
}

// ---------------------------------------------------------------------------------
// Discovery (runs once, at load, so each finding becomes its own named test)
// ---------------------------------------------------------------------------------

const USE_SERVER_FILES = SOURCE_FILES.filter(
  (file) => readFileSync(path.join(ROOT, file), "utf8").includes("use server") && hasUseServerDirective(parse(file)),
);

type Case = { label: string; problem: string | null };

const actionCases: Case[] = [];
for (const file of USE_SERVER_FILES) {
  if (PUBLIC_ACTION_FILES.includes(file)) continue;
  const { items, unsupported } = listExports(parse(file));
  for (const item of items) {
    actionCases.push({ label: `${file} :: ${item.name}`, problem: actionGuardProblem(item) });
  }
  for (const form of unsupported) {
    actionCases.push({
      label: `${file} :: ${form}`,
      problem: "is an export form this test can't verify; export async functions directly",
    });
  }
}

const plannerPages = SOURCE_FILES.filter((file) => file.startsWith(`${PLANNER_DIR}/`) && file.endsWith("/page.tsx"));
const fetcherCases: Case[] = [];
for (const file of plannerPages) {
  for (const item of listExports(parse(file)).items) {
    if (item.isDefault || !item.isFunction || !item.isAsync) continue;
    fetcherCases.push({ label: `${file} :: ${item.name}`, problem: requireUserProblem(item) });
  }
}

const layoutFile = `${PLANNER_DIR}/layout.tsx`;
const layoutDefault = listExports(parse(layoutFile)).items.find((item) => item.isDefault);

const routeFiles = SOURCE_FILES.filter((file) => /(^|\/)route\.(ts|tsx)$/.test(file));
const proxy = readProxy();

// ---------------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------------

describe("Server Actions are guarded", () => {
  it.each(actionCases)("$label", ({ label, problem }) => {
    if (problem) expect.fail(`${label} ${problem}. See "Auth" in docs/standards.md.`);
  });
});

describe("planner layout and data fetchers require a user", () => {
  it(`${layoutFile} :: default`, () => {
    expect(layoutDefault, `${layoutFile} must have a default export`).toBeDefined();
    const problem = requireUserProblem(layoutDefault!);
    if (problem) expect.fail(`${layoutFile} layout ${problem}. See "Auth" in docs/standards.md.`);
  });

  it.each(fetcherCases)("$label", ({ label, problem }) => {
    if (problem) expect.fail(`${label} ${problem}. See "Auth" in docs/standards.md.`);
  });
});

describe("proxy", () => {
  it("src/proxy.ts has a default export (the auth middleware)", () => {
    expect(proxy.hasDefaultExport).toBe(true);
  });

  it("matcher still covers /planner/:path*", () => {
    expect(
      proxy.matchers,
      "src/proxy.ts config.matcher no longer includes '/planner/:path*'; signed-out visitors would reach the planner",
    ).toContain("/planner/:path*");
  });
});

describe("route handlers", () => {
  it.each(routeFiles)("%s is on the public allowlist", (file) => {
    expect(
      PUBLIC_ROUTE_FILES,
      `${file} is a public endpoint that the /planner matcher does not cover. Guard it, or add it to PUBLIC_ROUTE_FILES with a justification.`,
    ).toContain(file);
  });
});

describe("scan sanity (a broken scan must fail, not pass silently)", () => {
  it("found the planner's Server Actions", () => {
    const plannerActions = actionCases.filter((c) => c.label.startsWith(`${PLANNER_DIR}/`));
    expect(plannerActions.length).toBeGreaterThan(0);
  });

  it("found planner data fetchers", () => {
    expect(fetcherCases.length).toBeGreaterThan(0);
  });

  it.each(PUBLIC_ACTION_FILES)("public action allowlist entry %s is still a real \"use server\" file", (file) => {
    expect(USE_SERVER_FILES).toContain(file);
  });

  it.each(PUBLIC_ROUTE_FILES)("public route allowlist entry %s still exists", (file) => {
    expect(existsSync(path.join(ROOT, file))).toBe(true);
  });
});
