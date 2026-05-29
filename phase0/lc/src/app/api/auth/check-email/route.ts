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
          process.env.NEXT_PUBLIC_APP_URL || (process.env.NODE_ENV === "production" ? "https://mvp.aggilo.in" : "http://localhost:3001")
        }${withBasePath("/auth/callback")}`,
      },
    });

    if (error) {
      const msg = (error.message || "").toLowerCase();
      const code = (error.code || "").toLowerCase();

      const isUserNotFound =
        msg.includes("signups not allowed") ||
        msg.includes("user not found") ||
        msg.includes("email not found") ||
        msg.includes("does not exist") ||
        code.includes("not_found") ||
        code.includes("user_not_found");

      if (!isUserNotFound) {
        // Rate limit, email provider error, etc. — user exists but we
        // couldn't send. Show "Check your email" rather than signup.
        console.warn("[check-email] signInWithOtp error (existing user):", error.message);
        return NextResponse.json({ exists: true });
      }

      return NextResponse.json({ exists: false });
    }
    return NextResponse.json({ exists: true });
  } catch {
    return NextResponse.json({ exists: false });
  }
}
