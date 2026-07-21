import { cache } from "react";
import { auth } from "@/auth";
import { isApprovedEmail } from "@/auth.config";
import { redirect } from "next/navigation";
import type { Session } from "next-auth";

/**
 * Request-scoped memo of auth().
 *
 * The guard now sits on every data fetcher, so rendering /planner alone would
 * otherwise verify the same JWT five times (layout + four fetchers). cache()
 * collapses those to one per request without callers having to thread a session
 * through, and resets between requests so a stale session is never reused.
 */
const getSession = cache(async (): Promise<Session | null> => auth());

/**
 * The failure an action returns when the caller's session is gone or revoked.
 * Shaped to fit the ActionResult contract, plus a flag the client keys off to
 * send the user to sign in rather than flagging an input.
 */
export type AuthFailure = { ok: false; error: string; authRequired: true };

const SESSION_EXPIRED_MESSAGE = 'Your session has expired. Please sign in again.';

/**
 * The session for a signed-in, still-approved user — or null.
 *
 * Checks the allow list rather than merely "is there a session": the JWT strategy
 * means a session outlives a removal from PLANNER_ALLOW_LIST, so presence of a
 * session is not proof of authorization.
 */
export async function getApprovedSession (): Promise<Session | null> {
  const session = await getSession();
  if (!session?.user || !isApprovedEmail(session.user.email)) {
    return null;
  }

  return session;
}

/**
 * Guard for Server Components — pages, layouts and the data fetchers they call.
 * Redirects when the caller is not a signed-in, approved user.
 *
 * Returns the session so callers can authorize per-user later on. Throwing the
 * identity away was what limited this to an "is anyone logged in?" check.
 */
export async function requireUser (): Promise<Session> {
  const session = await getSession();

  if (!session?.user) {
    redirect('/sign-in');
  }

  // Signed in, but no longer on the allow list — a different failure, and one the
  // user cannot fix by signing in again, so it gets a different destination.
  if (!isApprovedEmail(session.user.email)) {
    redirect('/access-denied?error=AccessDenied');
  }

  return session;
}

/**
 * Guard for Server Actions.
 *
 * Deliberately does NOT redirect: redirect() works by throwing, which rejects the
 * action's promise and lands the client in its generic catch ("Something went
 * wrong"), with no hint that the fix is to sign in. Returning a value instead keeps
 * the ActionResult contract intact.
 *
 * @returns the session on success, or an ActionResult-shaped failure
 */
export async function requireUserAction (): Promise<{ ok: true; session: Session } | AuthFailure> {
  const session = await getApprovedSession();

  if (!session) {
    return { ok: false, error: SESSION_EXPIRED_MESSAGE, authRequired: true };
  }

  return { ok: true, session };
}
