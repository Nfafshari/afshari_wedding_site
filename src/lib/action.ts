import { Prisma } from '@/generated/prisma/client';
import { parseHttpUrl } from '@/lib/utils';

/**
 * The shape every planner action returns: either it worked, or it failed with a reason.
 * The client checks `ok` to decide whether to close the dialog or show an error,
 * and `field` to decide which input to flag. F is the action file's own field union.
 */
export type ActionResult<F extends string = string> =
  | { ok: true }
  | { ok: false; error: string; field?: F; authRequired?: true };

export const GENERIC_ERROR = 'Something went wrong. Please try again.';

/** The Prisma codes the planner actions turn into a user-facing message. */
type KnownCode = 'P2002' | 'P2003' | 'P2025';

/**
 * Bounds a whole-number input (a quantity or count) to 1..max.
 * @returns a failing ActionResult, or null when the value is acceptable
 */
export function validateWholeNumber<F extends string> (value: number, field: F, label: string, max: number): ActionResult<F> | null {
  // Number(...) can hand us NaN if the client sent something non-numeric.
  if (!Number.isInteger(value) || value < 1) {
    return { ok: false, error: `${label} must be a whole number of 1 or more.`, field };
  }

  if (value > max) {
    return { ok: false, error: `${label} must be ${max} or less.`, field };
  }

  return null;
}

/**
 * Rejects anything that isn't a plain http(s) address. These values are rendered
 * into an href/src, so a `javascript:` URL here would execute on click.
 * @returns a failing ActionResult, or null when the URL is acceptable
 */
export function validateHttpUrl<F extends string> (value: string, field: F, label: string): ActionResult<F> | null {
  if (parseHttpUrl(value) === null) {
    return { ok: false, error: `${label} must be a valid link starting with http:// or https://.`, field };
  }

  return null;
}

/**
 * The shared catch block. A Prisma error whose code the caller listed becomes that
 * message; anything else is unexpected, so it is logged and the user sees a generic one.
 * @param doing - what the action was doing, for the log line ("creating new registry item")
 * @param known - the messages for the codes this action expects (P2002 unique, P2003 foreign key, P2025 not found)
 */
export function handleActionError<F extends string> (
  error: unknown,
  doing: string,
  known: Partial<Record<KnownCode, { error: string; field?: F }>>,
): ActionResult<F> {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const mapped = known[error.code as KnownCode];
    if (mapped) {
      return { ok: false, ...mapped };
    }
  }

  console.error(`*ERROR - error ${doing}, see below:\n${error}`);
  return { ok: false, error: GENERIC_ERROR };
}
