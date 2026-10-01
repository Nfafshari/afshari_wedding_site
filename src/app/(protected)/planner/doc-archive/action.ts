"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireUserAction } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";
import { supabase, DOCUMENTS_BUCKET } from "@/lib/supabase";
import { Prisma } from "@/generated/prisma/client";
import { ACCEPTED_DOC_TYPES, MAX_DOC_SIZE_BYTES } from "./data";

/**
 * Which input a failure relates to, so the client can flag the right field.
 * Omitted for general/unexpected errors.
 */
export type ErrorField = 'name' | 'companyName' | 'file';

/**
 * The shape every action returns: either it worked, or it failed with a reason.
 */
export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; field?: ErrorField; authRequired?: true };

/** The route these writes invalidate. `(protected)` is a route group, so it is not in the URL. */
const DOC_ARCHIVE_PATH = '/planner/doc-archive';
/** The planner overview, whose card counts the archive. */
const PLANNER_PATH = '/planner';

/**
 * Uploads a file to Storage and adds it to the archive.
 *
 * Takes FormData because a File can only reach a server action inside a form body.
 *
 * @param formData - `name`, `companyName`, `icon` (lucide displayName) and `file`
 */
export async function createDocument(formData: FormData): Promise<ActionResult> {
  /* Validate user session */
  const guard = await requireUserAction();
  if (!guard.ok) {
    return guard;
  }

  // Validate on the server. FormData values are `File | string | null`, so coerce
  // before trimming rather than trusting the client sent strings.
  const trimmedName = String(formData.get('name') ?? '').trim();
  if (trimmedName === '') {
    return { ok: false, error: 'Document name cannot be empty.', field: 'name' };
  }

  const trimmedCompanyName = String(formData.get('companyName') ?? '').trim();
  if (trimmedCompanyName === '') {
    return { ok: false, error: 'Company name cannot be empty.', field: 'companyName' };
  }

  const icon = String(formData.get('icon') ?? '');

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: 'Please choose a file to upload.', field: 'file' };
  }
  if (file.size > MAX_DOC_SIZE_BYTES) {
    return { ok: false, error: 'File is too large (4 MB max).', field: 'file' };
  }
  const extensions = ACCEPTED_DOC_TYPES[file.type];
  if (extensions === undefined) {
    return { ok: false, error: 'Only PDF, PNG and JPG files are allowed.', field: 'file' };
  }

  // A random key, not the user's filename: no collisions, nothing to sanitize.
  const filePath = `${randomUUID()}${extensions[0]}`;

  const { error: uploadError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(filePath, file, { contentType: file.type });
  if (uploadError) {
    console.error("*ERROR - createDocument upload failed, see below:", uploadError);
    return { ok: false, error: 'The file could not be uploaded. Please try again.', field: 'file' };
  }

  try {
    await prisma.document.create({
      data: { name: trimmedName, companyName: trimmedCompanyName, icon, filePath },
    });
  } catch (error) {
    // The upload already landed, so a failed insert would leave an orphan in the
    // bucket that nothing points at. Remove it before reporting the failure.
    await supabase.storage.from(DOCUMENTS_BUCKET).remove([filePath]);

    // P2002 = unique constraint failed (a document with this name already exists).
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { ok: false, error: 'Document already exists!', field: 'name' };
    }
    console.error("*ERROR - createDocument failed, see below:", error);
    return { ok: false, error: 'Something went wrong. Please try again.' };
  }

  revalidatePath(DOC_ARCHIVE_PATH);
  revalidatePath(PLANNER_PATH);
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
    await prisma.document.update({ where: { id }, data: { name: trimmedName, icon } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // P2002 = unique constraint failed, P2025 = record not found.
      if (error.code === 'P2002') {
        return { ok: false, error: 'Document already exists!', field: 'name' };
      }
      if (error.code === 'P2025') {
        return { ok: false, error: 'That document no longer exists, refresh your page and try again.', field: 'name' };
      }
    }
    console.error("*ERROR - updateDocument failed, see below:", error);
    return { ok: false, error: 'Something went wrong. Please try again.' };
  }

  revalidatePath(DOC_ARCHIVE_PATH);
  return { ok: true };
}

/**
 * Deletes a document from the archive, along with its stored file.
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

  let filePath: string;
  try {
    // delete returns the removed row, which is how we learn which file to remove.
    ({ filePath } = await prisma.document.delete({ where: { id }, select: { filePath: true } }));
  } catch (error) {
    // P2025 = record not found.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return { ok: false, error: 'That document no longer exists, refresh your page and try again.' };
    }
    console.error("*ERROR - deleteDocument failed, see below:", error);
    return { ok: false, error: 'Something went wrong. Please try again.' };
  }

  // Row first, file second: if this removal fails the worst case is an unreachable
  // file in the bucket, rather than a card whose link is dead. So log, don't fail.
  const { error: removeError } = await supabase.storage.from(DOCUMENTS_BUCKET).remove([filePath]);
  if (removeError) {
    console.error(`*ERROR - deleteDocument left an orphaned file (${filePath}), see below:`, removeError);
  }

  revalidatePath(DOC_ARCHIVE_PATH);
  revalidatePath(PLANNER_PATH);
  return { ok: true };
}
