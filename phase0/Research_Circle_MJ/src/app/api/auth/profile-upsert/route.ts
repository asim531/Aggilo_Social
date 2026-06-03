import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { CLUSTER_ID } from "@/lib/cluster";

/**
 * POST /api/auth/profile-upsert
 *
 * Called by the client-side /auth/confirm page after the user has
 * successfully exchanged their magic-link code for a session.
 * Creates or updates their Research Circle MJ profile using the
 * onboarding metadata stored in Supabase auth.user_metadata.
 */
export async function POST(request: Request) {
  const body = (await request.json()) as {
    id: string;
    email?: string | null;
    metadata?: Record<string, unknown>;
  };

  const { id: userId, email, metadata = {} } = body;

  if (!userId) {
    return NextResponse.json({ error: "Missing user id" }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const meta = metadata;

    const nickname =
      (typeof meta.nickname === "string" ? meta.nickname.trim() : null) ??
      email?.split("@")[0] ??
      "Member";
    const gender =
      typeof meta.gender === "string" ? meta.gender : null;
    const birthYear =
      typeof meta.birth_year === "number"
        ? meta.birth_year
        : typeof meta.birth_year === "string"
          ? parseInt(meta.birth_year, 10) || null
          : null;
    const country =
      typeof meta.country === "string" ? meta.country : null;

    const insertPayload: Record<string, unknown> = {
      id: userId,
      cluster_id: CLUSTER_ID,
      nickname,
      role: "member",
    };
    if (gender) insertPayload.gender = gender;
    if (birthYear) insertPayload.birth_year = birthYear;
    if (country) insertPayload.country = country;

    console.log("[profile-upsert] upsert payload:", insertPayload);
    const { error: upsertError } = await admin
      .from("profiles")
      .upsert(insertPayload, { onConflict: "id,cluster_id" });

    if (upsertError) {
      console.error("[profile-upsert] upsert error:", upsertError.message, upsertError.details);
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }
    console.log("[profile-upsert] upsert success");

    // Admin elevation
    const adminEmails = (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    if (email && adminEmails.includes(email.toLowerCase())) {
      const { error: adminErr } = await admin
        .from("profiles")
        .update({ role: "admin" })
        .eq("id", userId)
        .eq("cluster_id", CLUSTER_ID);
      if (adminErr) console.warn("[profile-upsert] admin update error:", adminErr.message);
    }

    // Founding member flag
    const foundingEmails = (process.env.FOUNDING_MEMBER_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    if (email && foundingEmails.includes(email.toLowerCase())) {
      const { error: founderErr } = await admin
        .from("profiles")
        .update({ is_founding_member: true })
        .eq("id", userId)
        .eq("cluster_id", CLUSTER_ID)
        .eq("is_founding_member", false);
      if (founderErr) console.warn("[profile-upsert] founder update error:", founderErr.message);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[profile-upsert] exception:", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
