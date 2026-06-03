import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

/**
 * POST /api/auth/check-email
 *
 * Detects whether an email already has a confirmed Supabase auth user
 * (across the whole platform — auth.users is shared between the MVP
 * and Research Circle MJ clusters).
 *
 * Uses the admin client to query auth.users directly WITHOUT sending
 * any emails. The client-side AuthForm handles all email sending.
 */
export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ exists: false });
    }

    const adminClient = createAdminClient();
    const { data, error } = await adminClient.auth.admin.listUsers();

    if (error) {
      console.error("[check-email] listUsers error:", error.message);
      return NextResponse.json({ exists: false });
    }

    const exists = (data?.users ?? []).some(
      (u) => u.email === email.trim().toLowerCase()
    );
    return NextResponse.json({ exists });
  } catch (err) {
    console.error("[check-email] exception:", err);
    return NextResponse.json({ exists: false });
  }
}
