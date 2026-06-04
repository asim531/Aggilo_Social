/**
 * Supabase admin client — uses the service-role key to bypass RLS.
 *
 * Use only in server-side code that needs to write data the user themselves
 * cannot (e.g. promoting a profile to admin role, ingesting behavioural
 * events on behalf of a user, system-level inserts to llm_response_logs).
 *
 * NEVER import this from a client component. The service-role key must
 * not leave the server.
 */

import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

export function adminClient(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "adminClient: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set"
    );
  }

  cached = createSupabaseClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
