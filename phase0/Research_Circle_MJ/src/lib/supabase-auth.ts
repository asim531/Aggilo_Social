/**
 * Browser Supabase client for magic-link auth.
 *
 * Uses @supabase/supabase-js with localStorage and PKCE flow.
 * This is the proven working approach for magic-link authentication.
 * The detectSessionInUrl is disabled to prevent conflicts with
 * the dedicated auth confirmation page.
 */

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createAuthClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: "pkce",
        storageKey: "rcmj-auth-token",
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    }
  );
}
