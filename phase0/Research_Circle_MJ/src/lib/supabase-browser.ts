/**
 * Browser-side Supabase client.
 *
 * Used in Client Components for auth state, realtime subscriptions, and
 * any read that should respect the user's session cookies.
 *
 * detectSessionInUrl is DISABLED — the dedicated auth client in
 * supabase-auth.ts handles PKCE code exchange. If this client also tried
 * to read the code from the URL it would look in the wrong storage key
 * and fail with "PKCE code verifier not found".
 */

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        detectSessionInUrl: false,
      },
    }
  );
}
