import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * POST /api/auth/set-session
 *
 * Receives access_token and refresh_token from the client after
 * successful PKCE code exchange, and sets them as cookies using
 * @supabase/ssr so server-side pages (like /cluster) can read
 * the session.
 */
export async function POST(request: NextRequest) {
  try {
    const { access_token, refresh_token } = (await request.json()) as {
      access_token?: string;
      refresh_token?: string;
    };

    if (!access_token || !refresh_token) {
      return NextResponse.json({ error: "Missing tokens" }, { status: 400 });
    }

    let response = NextResponse.json({ ok: true });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(
            cookiesToSet: {
              name: string;
              value: string;
              options?: Record<string, unknown>;
            }[]
          ) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });

    if (error) {
      console.error("[set-session] setSession error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("[set-session] cookies set, returning response");
    return response;
  } catch (err) {
    console.error("[set-session] exception:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
