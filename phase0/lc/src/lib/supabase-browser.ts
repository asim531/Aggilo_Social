/**
 * Browser-side Supabase client.
 *
 * Used in Client Components for auth state, realtime subscriptions, and
 * any read that should respect the user's session cookies.
 */

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
