import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/** The private Storage bucket uploaded planner documents live in. */
export const DOCUMENTS_BUCKET = 'documents';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Fail loudly at import rather than letting an empty string reach Supabase, which
// answers with an opaque auth error far away from the real cause.
if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.');
}

// Reuse a single client across hot-reloads in development, same as the Prisma client.
// Server-only: the service role key bypasses RLS, so this must never be imported by
// a client component. Every caller is already behind requireUser/requireUserAction.
const globalForSupabase = globalThis as unknown as { supabase?: SupabaseClient };

export const supabase = globalForSupabase.supabase ?? createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

if (process.env.NODE_ENV !== 'production') {
  globalForSupabase.supabase = supabase;
}
