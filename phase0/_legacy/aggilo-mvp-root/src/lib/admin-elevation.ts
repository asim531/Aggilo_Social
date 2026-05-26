/**
 * Admin elevation — runs on every authenticated request via the
 * /api/auth/callback route and on first sign-in.
 *
 * Two-step sync:
 *   1. Sync the ADMIN_EMAILS env var into platform_settings on each call.
 *      This way admins can be added by editing the env without hitting
 *      Supabase manually.
 *   2. If the current user's email matches any allowlisted email,
 *      ensure their profile.role is 'founder'.
 *
 * Cheap to run — two upserts. Idempotent.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export async function syncAdminAllowlist(admin: SupabaseClient): Promise<string[]> {
  const csv = process.env.ADMIN_EMAILS ?? "";
  const cleaned = csv
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .join(",");

  if (!cleaned) return [];

  await admin
    .from("platform_settings")
    .upsert({ key: "admin_emails", value: cleaned, updated_at: new Date().toISOString() });

  return cleaned.split(",");
}

export async function ensureAdminRoleForEmail(
  admin: SupabaseClient,
  userId: string,
  email: string | null | undefined
): Promise<boolean> {
  if (!email) return false;
  const emails = await syncAdminAllowlist(admin);
  if (emails.length === 0) return false;
  if (!emails.includes(email.toLowerCase())) return false;

  const { error } = await admin
    .from("profiles")
    .update({ role: "founder" })
    .eq("id", userId);

  if (error) {
    console.warn("[admin-elevation] role update failed:", error.message);
    return false;
  }
  return true;
}
