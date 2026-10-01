/**
 * A document in the archive, as page.tsx hands it to the client.
 *
 * `icon` is the lucide displayName (e.g. "Receipt"), not the component: a component
 * cannot cross from a server component into a client one, a string can. The client
 * turns it back into a component with `resolveDocIcon`. `link` is a signed URL that
 * expires, minted fresh on every render.
 */
export type ArchivedDoc = {
  id: number;
  name: string;
  createdAt: Date;
  companyName: string;
  icon: string;
  link: string;
};

/**
 * Upload limits, shared by the dropzone and the server action so the two can't drift.
 * Kept under Vercel's 4.5 MB request-body cap, which is next.config's bodySizeLimit.
 * These live here, not in action.ts, because a "use server" file may only export
 * async functions.
 */
export const MAX_DOC_SIZE_BYTES = 4 * 1024 * 1024;

/** MIME types the archive accepts, mapped to the extensions react-dropzone checks. */
export const ACCEPTED_DOC_TYPES: Record<string, string[]> = {
  'application/pdf': ['.pdf'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
};
