import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { adminClient } from "@/lib/supabase-admin";
import { ensureAdminRoleForEmail } from "@/lib/admin-elevation";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // After session exchange, update the profile with nickname and gender
      // from the OTP sign-up metadata
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const metadata = user.user_metadata;
        const nickname = metadata?.nickname;
        const gender = metadata?.gender;
        const country = metadata?.country;

        if (nickname || gender || country) {
          const updates: Record<string, string | boolean> = {};
          if (nickname) updates.nickname = nickname;
          if (gender) updates.gender = gender;
          if (country) updates.country = country;

          await supabase
            .from("profiles")
            .update(updates)
            .eq("id", user.id);
        }

        // Admin elevation — uses service role to update role if email is
        // in the ADMIN_EMAILS allowlist. Idempotent: a regular member's
        // role stays 'member'; an allowlisted email becomes 'founder'.
        try {
          if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
            const admin = adminClient();
            await ensureAdminRoleForEmail(admin, user.id, user.email);
          }
        } catch (err) {
          console.warn("[auth/callback] admin elevation skipped:", (err as Error).message);
        }
      }

      return NextResponse.redirect(`${origin}/cluster`);
    } else {
      // PKCE mismatch or expired code — redirect to the client-side callback
      // page which shows a user-friendly message
      return NextResponse.redirect(
        `${origin}/auth/callback?error_description=${encodeURIComponent(error.message)}`
      );
    }
  }

  // If there's an error description in the URL
  const error_description = searchParams.get("error_description");
  if (error_description) {
    return NextResponse.redirect(
      `${origin}/auth/callback?error_description=${encodeURIComponent(error_description)}`
    );
  }

  // No code and no error — let the client-side page handle it (hash fragment)
  return NextResponse.redirect(`${origin}/auth/callback?error_description=No+code+provided`);
}
