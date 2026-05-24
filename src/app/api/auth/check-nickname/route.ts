import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase-admin";

/**
 * POST /api/auth/check-nickname
 *
 * Checks whether a nickname is already taken in the profiles table.
 * Case-insensitive match — "Fatima" and "fatima" are the same nickname.
 *
 * Used by the sign-up flow (AuthForm) before the user proceeds from
 * the nickname step, so they get immediate feedback rather than a
 * confusing error at the end of the flow.
 *
 * Returns: { available: boolean }
 */
export async function POST(request: Request) {
  try {
    const { nickname } = await request.json();
    if (!nickname || typeof nickname !== "string" || nickname.trim().length < 2) {
      return NextResponse.json({ available: false, reason: "invalid" });
    }

    let admin;
    try {
      admin = adminClient();
    } catch {
      // Service key not configured — fail open so sign-up isn't blocked
      return NextResponse.json({ available: true });
    }

    const { count } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .ilike("nickname", nickname.trim());

    const available = (count ?? 0) === 0;
    return NextResponse.json({ available });
  } catch {
    // Fail open — don't block sign-up on a check error
    return NextResponse.json({ available: true });
  }
}
