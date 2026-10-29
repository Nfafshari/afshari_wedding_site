import { afterEach, describe, expect, it, vi } from "vitest";

type AuthConfigModule = typeof import("@/auth.config");

// APPROVED_ACCOUNTS is parsed from PLANNER_ALLOW_LIST once, when the module loads, so
// every case sets the env var first and then imports a fresh copy.
async function loadAuthConfig(allowList: string | undefined): Promise<AuthConfigModule> {
  vi.resetModules();
  vi.stubEnv("PLANNER_ALLOW_LIST", allowList);
  return import("@/auth.config");
}

// The callbacks are optional on the Auth.js type; fail loudly if one is ever removed.
// Arguments are hand-built and cast: the real parameter types are large and irrelevant here.
function getCallbacks({ authConfig }: AuthConfigModule) {
  const { jwt, signIn, authorized } = authConfig.callbacks ?? {};
  if (!jwt || !signIn || !authorized) throw new Error("auth callbacks are missing from authConfig");
  return { jwt, signIn, authorized };
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("isApprovedEmail", () => {
  it.each([
    ["an exact match", "me@example.com", "me@example.com"],
    ["a different case", "me@example.com", "ME@Example.com"],
    ["surrounding whitespace", "me@example.com", "  me@example.com  "],
    ["a messy allow list (spaces, mixed case)", " Me@Example.com , you@example.com ", "you@EXAMPLE.com"],
  ])("approves %s", async (_name, allowList, email) => {
    const { isApprovedEmail } = await loadAuthConfig(allowList);
    expect(isApprovedEmail(email)).toBe(true);
  });

  it.each([
    ["an email not on the list", "me@example.com", "stranger@example.com"],
    ["a lookalike of an approved email", "me@example.com", "me@example.com.evil.test"],
    ["null", "me@example.com", null],
    ["undefined", "me@example.com", undefined],
    ["an empty string", "me@example.com", ""],
    ["a blank string", "me@example.com", "   "],
  ])("rejects %s", async (_name, allowList, email) => {
    const { isApprovedEmail } = await loadAuthConfig(allowList);
    expect(isApprovedEmail(email)).toBe(false);
  });

  it.each([
    ["unset", undefined],
    ["empty", ""],
    ["only commas and spaces", " , ,, "],
  ])("rejects everyone, including an empty email, when the allow list is %s", async (_name, allowList) => {
    const { isApprovedEmail } = await loadAuthConfig(allowList);
    expect(isApprovedEmail("me@example.com")).toBe(false);
    expect(isApprovedEmail("")).toBe(false);
    expect(isApprovedEmail(null)).toBe(false);
  });
});

describe("jwt callback (drops de-authorized sessions)", () => {
  it("keeps the token of an approved user unchanged", async () => {
    const { jwt } = getCallbacks(await loadAuthConfig("me@example.com"));
    const token = { email: "me@example.com", name: "Me" };
    expect(await jwt({ token } as never)).toBe(token);
  });

  it("returns null once the email is no longer on the allow list", async () => {
    const { jwt } = getCallbacks(await loadAuthConfig("someone-else@example.com"));
    expect(await jwt({ token: { email: "me@example.com" } } as never)).toBeNull();
  });

  it("returns null for a token with no email", async () => {
    const { jwt } = getCallbacks(await loadAuthConfig("me@example.com"));
    expect(await jwt({ token: {} } as never)).toBeNull();
  });
});

describe("signIn callback (who may log in)", () => {
  const profile = (overrides: Record<string, unknown> = {}) => ({
    profile: { email: "me@example.com", email_verified: true, ...overrides },
  });

  it("allows a Google-verified, approved email", async () => {
    const { signIn } = getCallbacks(await loadAuthConfig("me@example.com"));
    expect(await signIn(profile() as never)).toBe(true);
  });

  it("rejects an approved email that Google has not verified", async () => {
    const { signIn } = getCallbacks(await loadAuthConfig("me@example.com"));
    expect(await signIn(profile({ email_verified: false }) as never)).toBe(false);
    expect(await signIn(profile({ email_verified: undefined }) as never)).toBe(false);
  });

  it("rejects a verified email that is not approved", async () => {
    const { signIn } = getCallbacks(await loadAuthConfig("me@example.com"));
    expect(await signIn(profile({ email: "stranger@example.com" }) as never)).toBe(false);
  });

  it("rejects when there is no profile", async () => {
    const { signIn } = getCallbacks(await loadAuthConfig("me@example.com"));
    expect(await signIn({} as never)).toBe(false);
  });

  it("fails closed, and logs why, when the allow list is empty", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    const { signIn } = getCallbacks(await loadAuthConfig(undefined));
    expect(await signIn(profile() as never)).toBe(false);
    expect(logged).toHaveBeenCalled();
  });
});

describe("authorized callback (per-request gate in the proxy)", () => {
  it("lets an approved user through", async () => {
    const { authorized } = getCallbacks(await loadAuthConfig("me@example.com"));
    expect(authorized({ auth: { user: { email: "me@example.com" } } } as never)).toBe(true);
  });

  it("blocks a signed-in user who is not approved", async () => {
    const { authorized } = getCallbacks(await loadAuthConfig("me@example.com"));
    expect(authorized({ auth: { user: { email: "stranger@example.com" } } } as never)).toBe(false);
  });

  it("blocks a signed-out request", async () => {
    const { authorized } = getCallbacks(await loadAuthConfig("me@example.com"));
    expect(authorized({ auth: null } as never)).toBe(false);
  });
});
