/**
 * GET /auth/callback
 *
 * DEPRECATED — forwards to /auth/confirm which handles the PKCE
 * exchange client-side where the code verifier is accessible.
 *
 * Old email links still point here; we preserve them by forwarding
 * all query parameters to the new handler.
 */

import { NextResponse } from "next/server";
import { withBasePath, resolvePublicUrl } from "@/lib/path";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const confirmUrl = new URL(resolvePublicUrl(request, "/auth/confirm"));
  searchParams.forEach((value, key) => {
    confirmUrl.searchParams.set(key, value);
  });

  return NextResponse.redirect(confirmUrl.toString());
}
