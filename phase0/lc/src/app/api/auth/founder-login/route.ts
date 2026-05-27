import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { withBasePath } from "@/lib/path";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, nickname, gender, birth_year, country } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    // Create a Supabase client with the service_role key to bypass email limits and generate links
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
    // We redirect to a dummy callback since we will intercept the redirect
    const redirectTo = `${appUrl}${withBasePath("/auth/callback")}`;

    const { data, error } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: email.trim().toLowerCase(),
      options: {
        data: {
          nickname,
          gender,
          birth_year,
          country,
        },
        redirectTo,
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data?.properties?.action_link) {
      return NextResponse.json(
        { error: "Failed to generate action link" },
        { status: 500 }
      );
    }

    // Fetch the action link to consume it and get the session tokens
    const res = await fetch(data.properties.action_link, { redirect: 'manual' });
    const location = res.headers.get("location");

    if (!location || !location.includes("#access_token=")) {
      return NextResponse.json(
        { error: "Failed to retrieve session tokens" },
        { status: 500 }
      );
    }

    // Parse the fragment parameters
    const fragment = location.split("#")[1];
    const params = new URLSearchParams(fragment);
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");

    if (!access_token || !refresh_token) {
      return NextResponse.json(
        { error: "Missing tokens in response" },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      session: {
        access_token,
        refresh_token
      }
    });
  } catch (error) {
    console.error("Founder login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
