import { afterEach, describe, expect, it, vi } from "vitest";

type FakeSession = { user?: { email?: string | null } } | null;

/**
 * Loads a fresh require-user.ts with the framework edges faked: `@/auth` (which would
 * boot all of Auth.js) returns the given session, and `redirect` throws, as the real one
 * does, so a guard that redirects stops the caller. The unit under test and
 * auth.config.ts stay real; allow-list parsing happens at import, hence the fresh load.
 */
async function loadRequireUser({ session, allowList = "me@example.com" }: { session: FakeSession; allowList?: string }) {
  vi.resetModules();
  vi.stubEnv("PLANNER_ALLOW_LIST", allowList);

  const redirect = vi.fn((url: string): never => {
    throw new Error(`REDIRECT ${url}`);
  });
  vi.doMock("@/auth", () => ({ auth: vi.fn().mockResolvedValue(session) }));
  vi.doMock("next/navigation", () => ({ redirect }));

  const guards = await import("@/lib/require-user");
  return { ...guards, redirect };
}

afterEach(() => {
  vi.doUnmock("@/auth");
  vi.doUnmock("next/navigation");
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

const approvedSession = { user: { email: "me@example.com" } };

describe("requireUserAction (guard for Server Actions)", () => {
  const sessionExpired = {
    ok: false,
    authRequired: true,
    error: expect.stringMatching(/session has expired/i),
  };

  it("returns the session for an approved user", async () => {
    const { requireUserAction } = await loadRequireUser({ session: approvedSession });
    expect(await requireUserAction()).toEqual({ ok: true, session: approvedSession });
  });

  it("matches the allow list case-insensitively", async () => {
    const session = { user: { email: "ME@Example.com" } };
    const { requireUserAction } = await loadRequireUser({ session });
    expect(await requireUserAction()).toEqual({ ok: true, session });
  });

  it("fails with authRequired when there is no session", async () => {
    const { requireUserAction } = await loadRequireUser({ session: null });
    expect(await requireUserAction()).toEqual(sessionExpired);
  });

  it("fails with authRequired when the session has no user", async () => {
    const { requireUserAction } = await loadRequireUser({ session: {} });
    expect(await requireUserAction()).toEqual(sessionExpired);
  });

  it("fails with authRequired when the session email is not approved", async () => {
    const { requireUserAction } = await loadRequireUser({ session: { user: { email: "stranger@example.com" } } });
    expect(await requireUserAction()).toEqual(sessionExpired);
  });

  it("fails once an already signed-in user is removed from the allow list", async () => {
    const { requireUserAction } = await loadRequireUser({ session: approvedSession, allowList: "someone-else@example.com" });
    expect(await requireUserAction()).toEqual(sessionExpired);
  });

  it("returns a failure instead of redirecting (a redirect would reject the action's promise)", async () => {
    const { requireUserAction, redirect } = await loadRequireUser({ session: null });
    await requireUserAction();
    expect(redirect).not.toHaveBeenCalled();
  });
});

describe("requireUser (guard for Server Components)", () => {
  it("returns the session for an approved user without redirecting", async () => {
    const { requireUser, redirect } = await loadRequireUser({ session: approvedSession });
    expect(await requireUser()).toEqual(approvedSession);
    expect(redirect).not.toHaveBeenCalled();
  });

  it("redirects to /sign-in when there is no session", async () => {
    const { requireUser, redirect } = await loadRequireUser({ session: null });
    await expect(requireUser()).rejects.toThrow("REDIRECT /sign-in");
    expect(redirect).toHaveBeenCalledWith("/sign-in");
  });

  it("redirects to /sign-in when the session has no user", async () => {
    const { requireUser, redirect } = await loadRequireUser({ session: {} });
    await expect(requireUser()).rejects.toThrow("REDIRECT /sign-in");
    expect(redirect).toHaveBeenCalledWith("/sign-in");
  });

  it("redirects a signed-in but unapproved user to /access-denied, not /sign-in", async () => {
    const { requireUser, redirect } = await loadRequireUser({ session: { user: { email: "stranger@example.com" } } });
    await expect(requireUser()).rejects.toThrow("REDIRECT /access-denied?error=AccessDenied");
    expect(redirect).toHaveBeenCalledWith("/access-denied?error=AccessDenied");
  });
});
