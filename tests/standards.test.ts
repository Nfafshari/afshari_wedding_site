import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import ts from "typescript";

/**
 * Structural checks for data-layer rules in docs/standards.md that have a clear yes/no
 * answer. Like tests/auth-guards.test.ts, they read the source and never run it.
 */

// ---------------------------------------------------------------------------------
// Files allowed to build their own PrismaClient. Adding one is a deliberate decision:
// give the reason on the line and justify it in the PR (for example, a standalone
// script that runs outside Next). A stale entry fails below.
// ---------------------------------------------------------------------------------
const CLIENT_ALLOWLIST = [
  "src/lib/prisma.ts", // the singleton every page and action imports
];

const ROOT = fileURLToPath(new URL("..", import.meta.url));

// ---------------------------------------------------------------------------------
// Source helpers (same approach as tests/auth-guards.test.ts)
// ---------------------------------------------------------------------------------

function toRelative(absolutePath: string): string {
  return path.relative(ROOT, absolutePath).split(path.sep).join("/");
}

function walk(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // generated/ is machine-written Prisma output, not ours to police here.
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
 * Counts real `new PrismaClient(...)` / `new Something.PrismaClient(...)` expressions.
 * Reading the syntax tree means a mention in a comment or string never counts.
 */
function countClientConstructions(relativePath: string): number {
  let count = 0;
  const visit = (node: ts.Node) => {
    if (ts.isNewExpression(node)) {
      const callee = node.expression;
      const name = ts.isIdentifier(callee)
        ? callee.text
        : ts.isPropertyAccessExpression(callee)
          ? callee.name.text
          : undefined;
      if (name === "PrismaClient") count++;
    }
    ts.forEachChild(node, visit);
  };
  visit(parse(relativePath));
  return count;
}

function git(args: string[]) {
  return spawnSync("git", args, { cwd: ROOT, encoding: "utf8" });
}

// ---------------------------------------------------------------------------------
// Discovery (once, at load, so each offending file becomes its own named test)
// ---------------------------------------------------------------------------------

const constructionsByFile = new Map<string, number>();
for (const file of SOURCE_FILES) {
  const count = countClientConstructions(file);
  if (count > 0) constructionsByFile.set(file, count);
}
const filesWithClients = [...constructionsByFile.keys()];

// ---------------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------------

describe("one Prisma client", () => {
  it.each(filesWithClients)("%s is allowed to construct a PrismaClient", (file) => {
    expect(
      CLIENT_ALLOWLIST,
      `${file} constructs a PrismaClient. docs/standards.md (Database): "Prisma client only via @/lib/prisma". ` +
        `Import the singleton, or add this file to CLIENT_ALLOWLIST with a reason.`,
    ).toContain(file);
  });
});

describe("generated code stays out of git", () => {
  it("no file under src/generated is tracked", () => {
    const result = git(["ls-files", "--", "src/generated"]);
    expect(result.status, `git ls-files failed: ${result.error?.message ?? result.stderr}`).toBe(0);
    const tracked = result.stdout.split("\n").filter(Boolean);
    expect(
      tracked,
      "docs/standards.md (Database): src/generated is machine-generated and must never be committed or hand-edited. " +
        "Untrack it with `git rm -r --cached src/generated`.",
    ).toEqual([]);
  });

  it("src/generated is gitignored", () => {
    // Exit code 0 = ignored, 1 = not ignored. Asks about a path, so the file need not exist.
    const result = git(["check-ignore", "-q", "src/generated/prisma/client.ts"]);
    expect(
      result.status,
      "src/generated is no longer gitignored. Restore `/src/generated` in .gitignore (the client is regenerated on install and build).",
    ).toBe(0);
  });
});

describe("scan sanity (a broken scan must fail, not pass silently)", () => {
  it("parsed a healthy number of source files", () => {
    expect(SOURCE_FILES.length).toBeGreaterThan(50);
  });

  it.each(CLIENT_ALLOWLIST)("allowlist entry %s still exists and still constructs a client", (file) => {
    expect(existsSync(path.join(ROOT, file)), `${file} is on CLIENT_ALLOWLIST but no longer exists`).toBe(true);
    expect(
      constructionsByFile.get(file) ?? 0,
      `${file} is on CLIENT_ALLOWLIST but no longer constructs a PrismaClient; remove the stale entry`,
    ).toBeGreaterThan(0);
  });

  it("src/lib/prisma.ts constructs exactly one client", () => {
    expect(constructionsByFile.get("src/lib/prisma.ts")).toBe(1);
  });
});
