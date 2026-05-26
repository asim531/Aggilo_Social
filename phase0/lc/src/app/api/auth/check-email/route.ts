import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { withBasePath } from "@/lib/path";

/**
 * POST /api/auth/check-email
 *
 * Detects whether an email already has a confirmed Supabase auth user
 * (across the whole platform — auth.users is shared between the MVP
 * and Long Conversation clusters). If yes, we send a sign-in magic
 * link rather than walking them through the full sign-up flow.
 *
 * Implementation: signInWithOtp with shouldCreateUser:false. If the
 * user exists, OTP is sent and error is null. If they do not exist,
 * Supabase returns an error which we treat as exists=false.
 */
export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ exists: false });
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"
        }${withBasePath("/auth/callback")}`,
      },
    });

    if (error) {
      return NextResponse.json({ exists: false });
    }
    return NextResponse.json({ exists: true });
  } catch {
    return NextResponse.json({ exists: false });
  }
}
