"use client";

/**
 * Auth callback — client-side handler
 *
 * This page exists to handle the case where the magic link is opened in
 * a different browser than where it was requested. In that scenario, the
 * PKCE code_verifier cookie is missing and the server-side route.ts fails
 * with "code challenge does not match previously saved code verifier."
 *
 * Supabase's client SDK can detect the hash fragment (#access_token=...)
 * and establish a session from it. This page:
 *   1. Lets the Supabase client SDK detect and process the URL hash
 *   2. If a session is established, redirects to /cluster
 *   3. If not, shows a helpful message with a "try again" button
 *
 * The server-side route.ts (GET handler) still handles the happy path
 * where the same browser is used. This page is the fallback.
 */

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";

export default function AuthCallbackPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const supabase = createClient();

    // Check if we already have a session (server-side route.ts succeeded)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        window.location.href = "/cluster";
        return;
      }

      // No session — check URL for error params
      const params = new URLSearchParams(window.location.search);
      const error = params.get("error") || params.get("error_description");

      if (error && error.includes("code challenge")) {
        // PKCE mismatch — the link was opened in a different browser.
        // Show a clear message and offer to re-send.
        setStatus("error");
        setErrorMsg(
          "The sign-in link was opened in a different browser than where you requested it. " +
          "For security, the link only works in the same browser. " +
          "Please go back to the original browser, or request a new link below."
        );
      } else if (error) {
        setStatus("error");
        setErrorMsg(error);
      } else {
        // Give the SDK a moment to process any hash fragment
        setTimeout(() => {
          supabase.auth.getSession().then(({ data: { session: s } }) => {
            if (s) {
              window.location.href = "/cluster";
            } else {
              setStatus("error");
              setErrorMsg(
                "Could not complete sign-in. The link may have expired or already been used. " +
                "Please request a new sign-in link."
              );
            }
          });
        }, 2000);
      }
    });
  }, []);

  if (status === "loading") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0b0d0f] px-4">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Signing you in...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0b0d0f] px-4">
      <div className="max-w-md w-full text-center p-6 rounded-xl bg-[#161a14] border border-gray-700">
        <p className="text-amber-400 text-lg font-medium mb-3">Sign-in issue</p>
        <p className="text-gray-400 text-sm leading-relaxed mb-6">{errorMsg}</p>
        <a
          href="/"
          className="inline-block px-6 py-3 rounded-lg bg-emerald-700 text-white font-medium text-sm hover:bg-emerald-600 transition-colors"
        >
          Go back and request a new link
        </a>
        <p className="text-xs text-gray-600 mt-4">
          Tip: Request the link and open it in the same browser — don&apos;t switch between apps.
        </p>
      </div>
    </main>
  );
}
