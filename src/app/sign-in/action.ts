"use server";

import { signIn } from "@/auth";

const DEFAULT_REDIRECT = '/planner';

/**
 * Narrows an untrusted ?callbackUrl to a same-origin planner path.
 *
 * An unvalidated redirect target is an open redirect: /sign-in?callbackUrl=https://evil.com
 * would turn our own domain into a phishing hop. So this allow-lists what is
 * acceptable instead of trying to blocklist what isn't.
 *
 * @returns the path to land on after login, falling back to the planner root
 */
function safeCallbackUrl (callbackUrl: FormDataEntryValue | null): string {
  if (typeof callbackUrl !== 'string' || callbackUrl === '') {
    return DEFAULT_REDIRECT;
  }

  let parsed: URL;
  try {
    // Resolving against a dummy origin lets us compare the parsed *path* rather than
    // pattern-match the raw string. It also catches the cases string checks miss:
    // "//evil.com" is protocol-relative — an absolute URL wearing a leading slash —
    // and resolves to a different origin, as does "https://evil.com".
    parsed = new URL(callbackUrl, 'https://placeholder.invalid');
  } catch {
    return DEFAULT_REDIRECT;
  }

  if (parsed.origin !== 'https://placeholder.invalid') {
    return DEFAULT_REDIRECT;
  }

  // Checked as a whole segment: startsWith('/planner') alone would also accept
  // something like "/plannerevil".
  const isPlannerPath = parsed.pathname === '/planner' || parsed.pathname.startsWith('/planner/');
  if (!isPlannerPath) {
    return DEFAULT_REDIRECT;
  }

  // Rebuilt from the parsed parts, so nothing from the raw input rides along.
  return `${parsed.pathname}${parsed.search}`;
}

export async function signOn (formData: FormData) {
  // The middleware attaches ?callbackUrl when it bounces a signed-out user, so a
  // deep link into the planner survives the round trip through Google.
  const redirectTo = safeCallbackUrl(formData.get('callbackUrl'));

  await signIn('google', { redirectTo });
}
