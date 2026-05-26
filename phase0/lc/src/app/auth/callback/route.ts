import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { CLUSTER_ID } from "@/lib/cluster";
import { withBasePath } from "@/lib/path";

/**
 * GET /auth/callback
 *
 * Magic-link handler. Exchanges the auth code for a session, then
 * ensures the user has a Long Conversation profile row with their
 * onboarding metadata (nickname, gender, birth_year, country).
 *
 * Critical detail: profiles are scoped by (auth_user_id, cluster_id).
 * The same auth user (same email) can have separate profiles in
 * Sisters in Dua and Long Conversation. We INSERT a Long Conversation
 * profile here unconditionally — the trigger creates the Sisters in
 * Dua row at signup time, which is fine for the MVP path. For the LC
 * path, we own profile creation here.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // basePath note: in production the public origin is https://aggilo.in
  // (the rewrite proxies through), and the public path is
  // `/c/long-conversation/...`. All redirects from this handler need
  // to go through withBasePath() so the URL bar lands on the
  // publicly-routable URL, not the un-prefixed internal one.
  const homePath = withBasePath("/");
  const clusterPath = withBasePath("/cluster");

  if (!code) {
    const errorDesc = searchParams.get("error_description");
    return NextResponse.redirect(
      `${origin}${homePath}?error=${encodeURIComponent(errorDesc ?? "No code provided")}`
    );
  }

  const supabase = await createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    const friendly = exchangeError.message.includes("code challenge")
      ? "Please request a new sign-in link and open it in the same browser where you requested it."
      : exchangeError.message;
    return NextResponse.redirect(
      `${origin}${homePath}?error=${encodeURIComponent(friendly)}`
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(
      `${origin}${homePath}?error=${encodeURIComponent("Session not established")}`
    );
  }

  // ── Profile upsert for Long Conversation ────────────────────────
  // Service-role client bypasses RLS so we can INSERT before the user
  // has a session view of their own profile (chicken-and-egg). The
  // composite PK (id, cluster_id) prevents duplicates; conflicts are
  // resolved by updating the metadata fields.
  try {
    const admin = createAdminClient();
    const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
    const nickname = typeof meta.nickname === "string" ? meta.nickname.trim() : null;
    const gender = typeof meta.gender === "string" ? meta.gender : null;
    const birthYear =
      typeof meta.birth_year === "number"
        ? meta.birth_year
        : typeof meta.birth_year === "string"
          ? parseInt(meta.birth_year, 10) || null
          : null;
    const country = typeof meta.country === "string" ? meta.country : null;

    // Build the insert payload, only including fields that have values.
    const insertPayload: Record<string, unknown> = {
      id: user.id,
      cluster_id: CLUSTER_ID,
      nickname: nickname ?? user.email?.split("@")[0] ?? "Member",
      role: "member",
    };
    if (gender) insertPayload.gender = gender;
    if (birthYear) insertPayload.birth_year = birthYear;
    if (country) insertPayload.country = country;

    // Upsert with composite PK conflict target.
    await admin
      .from("profiles")
      .upsert(insertPayload, { onConflict: "id,cluster_id" });

    // Admin elevation for the platform allowlist. Same pattern as MVP
    // but writes role='admin' (LC vocabulary) rather than 'founder'.
    const adminEmails = (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    if (
      user.email &&
      adminEmails.includes(user.email.toLowerCase()) &&
      user.id
    ) {
      await admin
        .from("profiles")
        .update({ role: "admin" })
        .eq("id", user.id)
        .eq("cluster_id", CLUSTER_ID);
    }
  } catch (err) {
    // Profile creation failure should not block login. The user can
    // still see the cluster (limited) and we surface this in logs for
    // admin review. This is a known-failure path documented for ops.
    console.warn(
      "[auth/callback] profile upsert failed:",
      err instanceof Error ? err.message : String(err)
    );
  }

  return NextResponse.redirect(`${origin}${clusterPath}`);
}
