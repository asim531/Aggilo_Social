import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { withBasePath } from "@/lib/path";

/**
 * Auth middleware — Long Conversation.
 *
 * Two redirects:
 *   - Unauthenticated users hitting /cluster or /admin → /
 *   - Authenticated users hitting / → /cluster
 *
 * basePath note: when the app is mounted under /c/long-conversation
 * via Vercel rewrite, `request.nextUrl.pathname` already includes
 * the basePath (Next strips it before matching routes, but in
 * middleware we see the prefixed path). The matcher in this file is
 * also basePath-aware via withBasePath() so the redirect lands on the
 * publicly-rewritten URL, not the deployment-internal path.
 *
 * The matcher excludes /api, /auth, /_next, and static asset paths so
 * the middleware doesn't run on every request. Analytics scripts and
 * api routes need to pass through untouched.
 */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // In dev, basePath is empty and request.nextUrl.pathname is "/cluster".
  // In prod, basePath is "/c/long-conversation" and pathname is the same
  // (Next strips the prefix from the matcher; we match the un-prefixed
  // form). The redirect target needs the prefix, so we go via
  // withBasePath().
  const path = request.nextUrl.pathname;

  if (!user && (path.startsWith("/cluster") || path.startsWith("/admin"))) {
    const redirectUrl = new URL(withBasePath("/"), request.url);
    redirectUrl.search = request.nextUrl.search;
    const response = NextResponse.redirect(redirectUrl);
    // Forward the cookies that were set during token refresh
    supabaseResponse.cookies.getAll().forEach((c) => {
      response.cookies.set(c.name, c.value, c);
    });
    return response;
  }

  if (user && path === "/") {
    // If it's a special founder invite flow, allow them to stay on the AuthForm
    // so they can complete their onboarding without needing a second email.
    if (request.nextUrl.searchParams.get("founder") === "tas") {
      return supabaseResponse;
    }

    const redirectUrl = new URL(withBasePath("/cluster"), request.url);
    redirectUrl.search = request.nextUrl.search;
    const response = NextResponse.redirect(redirectUrl);
    // Forward the cookies that were set during token refresh
    supabaseResponse.cookies.getAll().forEach((c) => {
      response.cookies.set(c.name, c.value, c);
    });
    return response;
  }

  return supabaseResponse;
}

export const config = {
  // The matcher patterns are un-prefixed — Next applies basePath to
  // them internally. So `/cluster/:path*` matches both
  // `/cluster/foo` (dev) and `/c/long-conversation/cluster/foo` (prod).
  matcher: ["/", "/cluster/:path*", "/admin/:path*"],
};
