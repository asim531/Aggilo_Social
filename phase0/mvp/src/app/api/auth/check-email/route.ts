import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

/**
 * POST /api/auth/check-email
 *
 * Checks whether an email address already has a confirmed account.
 * Used by the sign-up flow to detect returning users at the email step
 * and redirect them to sign-in rather than making them re-enter
 * nickname, gender, and country.
 *
 * Strategy: we can't query auth.users without the service role key.
 * Instead we use signInWithOtp with shouldCreateUser: false — if the
 * user exists, Supabase sends them a magic link and returns no error.
 * If the user does NOT exist, Supabase returns an error
 * ("Email not confirmed" or similar). We use this as the existence check.
 *
 * This is a server route so the API key stays server-side.
 */
export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ exists: false });
    }

    const supabase = await createClient();

    // Attempt a sign-in OTP with shouldCreateUser: false.
    // - If the user exists: OTP is sent, error is null → exists = true
    // - If the user does NOT exist: error is returned → exists = false
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/callback`,
      },
    });

    if (error) {
      // "Email not confirmed" or "User not found" — user doesn't exist
      return NextResponse.json({ exists: false });
    }

    // No error — user exists and magic link was sent
    return NextResponse.json({ exists: true });
  } catch {
    return NextResponse.json({ exists: false });
  }
}
