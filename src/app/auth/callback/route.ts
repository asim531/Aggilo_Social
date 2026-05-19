import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

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
      }

      return NextResponse.redirect(`${origin}/cluster`);
    } else {
      // Redirect to home with error
      return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(error.message)}`);
    }
  }

  // If there's an error description in the URL
  const error_description = searchParams.get("error_description");
  if (error_description) {
    return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(error_description)}`);
  }

  return NextResponse.redirect(`${origin}/?error=No_code_provided_in_callback_URL`);
}
