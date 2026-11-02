import { Prisma } from '@/generated/prisma/client';
import { checkHttpUrl, checkMoney, checkWholeNumber } from '@/lib/validate';

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

/*
 * The checks in lib/validate.ts, turned into an ActionResult that names the field.
 * Each returns a failing result, or null when the value is acceptable.
 */

/** Bounds a whole-number input (a quantity or count) to 1..max. */
export function validateWholeNumber<F extends string> (value: number, field: F, label: string, max: number): ActionResult<F> | null {
  const error = checkWholeNumber(value, label, max);
  return error ? { ok: false, error, field } : null;
}

/** Rejects anything that isn't a plain http(s) address (see checkHttpUrl). */
export function validateHttpUrl<F extends string> (value: string, field: F, label: string): ActionResult<F> | null {
  const error = checkHttpUrl(value, label);
  return error ? { ok: false, error, field } : null;
}

/** Bounds a money value to 0 up to the column's limit. */
export function validateMoney<F extends string> (value: number, field: F, label: string): ActionResult<F> | null {
  const error = checkMoney(value, label);
  return error ? { ok: false, error, field } : null;
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
