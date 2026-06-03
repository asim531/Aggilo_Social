/**
 * Server-only admin Supabase client.
 *
 * Bypasses RLS using the service role key. Use ONLY in server-side
 * code paths that genuinely need elevated access:
 *   - Inserting clio_tip_log rows (the worker, not the user)
 *   - Inserting Sage's posts (system_sage author, not auth.uid())
 *   - Reading aggregate cluster intelligence (admin dashboard)
 *
 * Never import this file from anything that can run in the browser.
 * The service role key is stored only in server environment variables.
 */

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    throw new Error(
      "Supabase admin client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  return createSupabaseClient(url, serviceRole, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
