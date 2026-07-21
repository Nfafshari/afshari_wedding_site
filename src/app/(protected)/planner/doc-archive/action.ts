"use server";

import { revalidatePath } from "next/cache";
import { requireUserAction } from "@/lib/require-user";
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
  | { ok: false; error: string; field?: ErrorField; authRequired?: true };

/** The route these writes invalidate. `(protected)` is a route group, so it is not in the URL. */
const DOC_ARCHIVE_PATH = '/planner/doc-archive';

/**
 * Example action — rename it, add params, and wire up Prisma.
 */
export async function exampleAction(name: string): Promise<ActionResult> {
  /* Validate user session */
  const guard = await requireUserAction();
  if (!guard.ok) {
    return guard;
  }

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
  revalidatePath(DOC_ARCHIVE_PATH);
  return { ok: true };
}

/**
 * Renames a document and updates the icon it is displayed with.
 *
 * @param id - the document being edited
 * @param name - the new display name
 * @param icon - displayName of a lucide icon, e.g. "Receipt"
 */
export async function updateDocument(id: number | undefined, name: string, icon: string): Promise<ActionResult> {
  /* Validate user session */
  const guard = await requireUserAction();
  if (!guard.ok) {
    return guard;
  }

  if (id === undefined) {
    return { ok: false, error: 'No document selected.' };
  }

  const trimmedName = name.trim();
  if (trimmedName === '') {
    return { ok: false, error: 'Document name cannot be empty.', field: 'name' };
  }

  try {
    // TODO: wire up Prisma once the Document model exists, e.g.
    // await prisma.document.update({ where: { id }, data: { name: trimmedName, icon } });
  } catch (error) {
    // P2002 = unique constraint, P2025 = record not found.
    console.error("*ERROR - updateDocument failed, see below:", error);
    return { ok: false, error: 'Something went wrong. Please try again.' };
  }

  revalidatePath(DOC_ARCHIVE_PATH);
  return { ok: true };
}

/**
 * Deletes a document from the archive.
 *
 * @param id - the document being deleted
 */
export async function deleteDocument(id: number | undefined): Promise<ActionResult> {
  /* Validate user session */
  const guard = await requireUserAction();
  if (!guard.ok) {
    return guard;
  }

  if (id === undefined) {
    return { ok: false, error: 'No document selected.' };
  }

  try {
    // TODO: wire up Prisma once the Document model exists, e.g.
    // await prisma.document.delete({ where: { id } });
    // The stored file needs deleting from blob storage here too, not just the row.
  } catch (error) {
    console.error("*ERROR - deleteDocument failed, see below:", error);
    return { ok: false, error: 'Something went wrong. Please try again.' };
  }

  revalidatePath(DOC_ARCHIVE_PATH);
  return { ok: true };
}
