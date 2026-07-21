import Google from "next-auth/providers/google";
import { NextAuthConfig } from "next-auth";

// Parsed once at module scope
const APPROVED_ACCOUNTS = (process.env.PLANNER_ALLOW_LIST ?? '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

// Shared by the sign-in gate, the per-request JWT check and requireUser()
export function isApprovedEmail (email: string | null | undefined): boolean {
  if (!email) {
    return false;
  }

  return APPROVED_ACCOUNTS.includes(email.trim().toLowerCase());
}

const authConfig: NextAuthConfig = {
  pages: {
    signIn:  '/sign-in',
    signOut: '/sign-out',
    error:   '/access-denied',
  },
  providers: [
    Google ({}),
  ],
  callbacks: {
    async signIn({ profile }) {
      try {
        // validate env data
        if (APPROVED_ACCOUNTS.length === 0) {
          throw new Error('*ERROR - No approved accounts, check settings.');
        }

        // check if email is found and account is verified through google
        if (profile?.email_verified === true && isApprovedEmail(profile?.email)) {
          return true;
        }

        return false;
      } catch (error) {
        console.error('*ERROR - failed to sign in.', error);
        return false;
      }
    },
    jwt({ token }) {
      if (!isApprovedEmail(token.email)) {
        return null;
      }

      return token;
    }
  }
}

export { authConfig }