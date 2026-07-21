import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { parseArgs } from "node:util";

const PROJECT_ROOT = process.cwd();
const NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const USAGE =
  'Usage: pnpm generate <component|page> <name> [--protected] [--layout] [--client] [--force]';

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

// "our-story" -> "OurStory"
function toPascalCase(kebab) {
  return kebab
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join("");
}

// Resolve a project-relative path and refuse anything that escapes the root.
function toProjectPath(relPath) {
  const absolute = resolve(PROJECT_ROOT, relPath);
  const rel = relative(PROJECT_ROOT, absolute);
  if (rel === "" || rel.startsWith("..") || isAbsolute(rel)) {
    throw new Error(`Refusing to write outside the project directory: ${relPath}`);
  }
  return absolute;
}

// Create a file, making parent folders as needed. Never clobbers unless forced.
function createFile(relPath, contents, force) {
  const absolute = toProjectPath(relPath);
  if (existsSync(absolute) && !force) {
    throw new Error(`File already exists: ${relPath} (use --force to overwrite)`);
  }
  mkdirSync(dirname(absolute), { recursive: true });
  writeFileSync(absolute, contents);
  console.log(`Created ${relPath}`);
}

/* ------------------------------------------------------------------ *
 * Templates  (literals are flush-left so the OUTPUT keeps clean indentation)
 * ------------------------------------------------------------------ */

function componentTemplate(name, isClient) {
  const directive = isClient ? '"use client";\n\n' : "";
  return `${directive}export default function ${name}() {
  return (
    <div>
      {/* TODO: build ${name} */}
    </div>
  );
}
`;
}

function pageTemplate(name) {
  return `export default function ${name}() {
  return (
    <div>
      {/* TODO: build the ${name} page */}
    </div>
  );
}
`;
}

function layoutTemplate(name) {
  return `export default function ${name}Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
`;
}

// Server wrapper for a protected page: fetch on the server, hand data to the client component.
function protectedPageTemplate(name) {
  return `import ${name} from "./client";
// import { prisma } from "@/lib/prisma";

export default async function ${name}Page() {
  // TODO: fetch data on the server, then pass it to <${name} /> as props.
  // const data = await prisma.model.findMany();

  return <${name} />;
}
`;
}

// Server Actions for a protected page. Mirrors the ActionResult contract used across the app.
// `route` is the URL path (route groups like "(protected)" are NOT part of the URL).
function actionTemplate(route) {
  return `"use server";

import { revalidatePath } from "next/cache";
// import { prisma } from "@/lib/prisma";
// import { Prisma } from "@/generated/prisma/client";

/**
 * Which input a failure relates to, so the client can flag the right field.
 * Omitted for general/unexpected errors.
 */
export type ErrorField = 'name';

/**
 * The shape every action returns: either it worked, or it failed with a reason.
 */
export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; field?: ErrorField };

/**
 * Example action — rename it, add params, and wire up Prisma.
 */
export async function exampleAction(name: string): Promise<ActionResult> {
  // Validate on the server.
  const trimmedName = name.trim();
  if (trimmedName === '') {
    return { ok: false, error: 'Name cannot be empty.', field: 'name' };
  }

  try {
    // TODO: perform the DB write, e.g.
    // await prisma.model.create({ data: { name: trimmedName } });
  } catch (error) {
    // P2002 = unique constraint, P2025 = record not found. Handle as needed:
    // if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') { ... }
    console.error("*ERROR - exampleAction failed, see below:", error);
    return { ok: false, error: 'Something went wrong. Please try again.' };
  }

  // Refresh the page data after a successful write.
  revalidatePath('/${route}');
  return { ok: true };
}
`;
}

/* ------------------------------------------------------------------ *
 * Main
 * ------------------------------------------------------------------ */

function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      protected: { type: "boolean", default: false },
      layout: { type: "boolean", default: false },
      client: { type: "boolean", default: false },
      force: { type: "boolean", default: false },
    },
  });

  const [type, name] = positionals;

  if (!type || !name) {
    throw new Error(`Missing arguments.\n${USAGE}`);
  }

  const kind = type.toLowerCase();
  if (kind !== "component" && kind !== "page") {
    throw new Error(`Unknown type "${type}". Expected "component" or "page".\n${USAGE}`);
  }

  if (!NAME_PATTERN.test(name)) {
    throw new Error(`Invalid name "${name}". Use kebab-case, e.g. "our-story".`);
  }

  const pascal = toPascalCase(name);

  if (kind === "component") {
    if (values.protected || values.layout) {
      throw new Error("--protected and --layout only apply to pages.");
    }
    createFile(
      `src/components/${name}.tsx`,
      componentTemplate(pascal, values.client),
      values.force,
    );
    return;
  }

  // kind === "page"
  if (values.client) {
    throw new Error(
      "--client applies to components, not pages. Pages are Server Components; " +
        'generate a "--client" component for the interactive parts.',
    );
  }

  const baseDir = values.protected ? "src/app/(protected)" : "src/app";
  const pageDir = `${baseDir}/${name}`;

  if (values.protected) {
    // Protected pages always get the full server/client/action trio.
    createFile(`${pageDir}/page.tsx`, protectedPageTemplate(pascal), values.force);
    createFile(`${pageDir}/client.tsx`, componentTemplate(pascal, true), values.force);
    createFile(`${pageDir}/action.ts`, actionTemplate(name), values.force);
  } else {
    createFile(`${pageDir}/page.tsx`, pageTemplate(pascal), values.force);
  }

  if (values.layout) {
    createFile(`${pageDir}/layout.tsx`, layoutTemplate(pascal), values.force);
  }
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
