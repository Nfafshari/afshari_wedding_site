import type { DemoStore } from "../demo-store";
import { resolveDocIcon } from "./dialogs/icon-picker";

/**
 * Demo twin of `(protected)/planner/doc-archive/action.ts` — and the one place the
 * demo does MORE than the real planner rather than the same.
 *
 * The real actions are scaffolding: they validate, run an empty `try`, and return
 * `{ ok: true }` without writing anything, because there is no Document table yet.
 * That is honest there and useless here — a visitor who clicks "Add" and watches a
 * success toast leave the page unchanged concludes the app is broken.
 *
 * So these are implemented against the store. When the Document model lands, the
 * real actions grow Prisma calls and this file stays as it is.
 */

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
  | { ok: false; error: string; field?: ErrorField };

export function createDocArchiveActions (store: DemoStore) {
  /**
   * Adds a document to the archive.
   *
   * @param name - the display name (cannot be empty, and must be unused)
   * @param companyName - the vendor it came from
   * @param icon - displayName of a lucide icon, e.g. "Receipt"
   * @param link - where the file can be opened
   */
  async function createDocument (name: string, companyName: string, icon: string, link: string): Promise<ActionResult> {
    const trimmedName = name.trim();
    if (trimmedName === '') {
      return { ok: false, error: 'Document name cannot be empty.', field: 'name' };
    }

    const trimmedCompanyName = companyName.trim();
    if (trimmedCompanyName === '') {
      return { ok: false, error: 'Company name cannot be empty.', field: 'companyName' };
    }

    if (link === '') {
      return { ok: false, error: 'Please choose a file to upload.', field: 'file' };
    }

    const isDuplicate = store.getState().docs.some((doc) => doc.name === trimmedName);
    if (isDuplicate) {
      return { ok: false, error: 'Document already exists!', field: 'name' };
    }

    const id = store.nextId();
    const createdAt = new Date();

    store.setState((prev) => ({
      ...prev,
      docs: [
        ...prev.docs,
        { id, name: trimmedName, companyName: trimmedCompanyName, icon: resolveDocIcon(icon), link, createdAt },
      ],
    }));

    return { ok: true };
  }

  /**
   * Renames a document and updates the icon it is displayed with.
   *
   * @param id - the document being edited
   * @param name - the new display name
   * @param icon - displayName of a lucide icon, e.g. "Receipt"
   */
  async function updateDocument (id: number | undefined, name: string, icon: string): Promise<ActionResult> {
    if (id === undefined) {
      return { ok: false, error: 'No document selected.' };
    }

    const trimmedName = name.trim();
    if (trimmedName === '') {
      return { ok: false, error: 'Document name cannot be empty.', field: 'name' };
    }

    const docs = store.getState().docs;

    if (docs.find((doc) => doc.id === id) === undefined) {
      return { ok: false, error: 'That document no longer exists, refresh your page and try again.', field: 'name' };
    }

    // Excluding the row being edited, so renaming a document to the name it already
    // has is allowed.
    const isDuplicate = docs.some((doc) => doc.id !== id && doc.name === trimmedName);
    if (isDuplicate) {
      return { ok: false, error: 'Document already exists!', field: 'name' };
    }

    store.setState((prev) => ({
      ...prev,
      docs: prev.docs.map((doc) =>
        doc.id === id ? { ...doc, name: trimmedName, icon: resolveDocIcon(icon) } : doc
      ),
    }));

    return { ok: true };
  }

  /**
   * Deletes a document from the archive.
   *
   * @param id - the document being deleted
   */
  async function deleteDocument (id: number | undefined): Promise<ActionResult> {
    if (id === undefined) {
      return { ok: false, error: 'No document selected.' };
    }

    if (store.getState().docs.find((doc) => doc.id === id) === undefined) {
      return { ok: false, error: 'That document no longer exists, refresh your page and try again.' };
    }

    // The real action notes that the stored file needs deleting from blob storage
    // here too. The demo's uploads are object URLs, which the browser reclaims when
    // the tab closes — so dropping the row really is the whole job.
    store.setState((prev) => ({
      ...prev,
      docs: prev.docs.filter((doc) => doc.id !== id),
    }));

    return { ok: true };
  }

  return { createDocument, updateDocument, deleteDocument };
}
