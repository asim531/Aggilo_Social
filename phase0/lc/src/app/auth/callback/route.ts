import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { CLUSTER_ID } from "@/lib/cluster";
import { withBasePath, resolvePublicUrl } from "@/lib/path";

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
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  // basePath note: in production the public origin is https://aggilo.in
  // (the rewrite proxies through), and the public path is
  // `/c/long-conversation/...`. All redirects from this handler need
  // to go through withBasePath() so the URL bar lands on the
  // publicly-routable URL, not the un-prefixed internal one.

  if (!code) {
    const errorDesc = searchParams.get("error_description");
    // Ensure we preserve the error parameter when bouncing back
    const errorUrl = new URL(resolvePublicUrl(request, "/"));
    errorUrl.searchParams.set("error", errorDesc ?? "No code provided");
    return NextResponse.redirect(errorUrl.toString());
  }

  const supabase = await createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    const friendly = exchangeError.message.includes("code challenge")
      ? "Please request a new sign-in link and open it in the same browser where you requested it."
      : exchangeError.message;
    const errorUrl = new URL(resolvePublicUrl(request, "/"));
    errorUrl.searchParams.set("error", friendly);
    return NextResponse.redirect(errorUrl.toString());
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const errorUrl = new URL(resolvePublicUrl(request, "/"));
    errorUrl.searchParams.set("error", "Session not established");
    return NextResponse.redirect(errorUrl.toString());
  }

  // ── Profile upsert for Long Conversation ────────────────────────
  // Service-role client bypasses RLS so we can INSERT before the user
  // has a session view of their own profile (chicken-and-egg). The
  // composite PK (id, cluster_id) prevents duplicates; conflicts are
  // resolved by updating the metadata fields.
  try {
    const admin = createAdminClient();
    const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
    
    // Fallback: read from URL params if metadata is empty (invite link flow)
    const urlGender = searchParams.get("gender");
    const urlBirthYear = searchParams.get("birth_year");
    const urlCountry = searchParams.get("country");
    const urlNickname = searchParams.get("founder");
    
    const nickname = (typeof meta.nickname === "string" ? meta.nickname.trim() : null) ?? urlNickname;
    const gender = (typeof meta.gender === "string" ? meta.gender : null) ?? urlGender;
    const birthYear =
      (typeof meta.birth_year === "number"
        ? meta.birth_year
        : typeof meta.birth_year === "string"
          ? parseInt(meta.birth_year, 10) || null
          : null) ?? (urlBirthYear ? parseInt(urlBirthYear, 10) || null : null);
    const country = (typeof meta.country === "string" ? meta.country : null) ?? urlCountry;

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

    // Founding-member flag. The cluster was created in response to a
    // specific waitlist request; the person who submitted that request
    // is the founding member. They get the founding-feedback prompt
    // on their first session in the cluster.
    //
    // Phase 0: founding emails are configured per-cluster in env. The
    // LC cluster's founding member is Tas. When the intake pipeline
    // ships in Phase 1, this will be replaced with a lookup against
    // cluster_intake_signals.
    const foundingEmails = (process.env.FOUNDING_MEMBER_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    if (
      user.email &&
      foundingEmails.includes(user.email.toLowerCase())
    ) {
      await admin
        .from("profiles")
        .update({ is_founding_member: true })
        .eq("id", user.id)
        .eq("cluster_id", CLUSTER_ID)
        .eq("is_founding_member", false);
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
  
  const next = searchParams.get("next");
  const finalPath = next ? next : "/cluster";

  return NextResponse.redirect(resolvePublicUrl(request, finalPath));
}
