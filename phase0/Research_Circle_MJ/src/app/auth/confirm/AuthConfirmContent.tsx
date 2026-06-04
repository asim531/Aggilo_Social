"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createAuthClient } from "@/lib/supabase-auth";
import { withBasePath } from "@/lib/path";

export function AuthConfirmContent() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState("");
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    // Read code from the live URL once — don't use useSearchParams
    // because it tracks the URL reactively and would become empty
    // after we strip params or on fast-refresh re-renders.
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const errorDesc = params.get("error_description");

    if (!code) {
      // No code — user likely pressed back after successful auth.
      // Check if they already have a session.
      (async () => {
        const supabase = createAuthClient();
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session) {
          router.replace("/cluster");
        } else {
          router.replace("/");
        }
      })();
      return;
    }

    async function run() {
      const supabase = createAuthClient();
      const { error: exchangeError, data } = await supabase.auth.exchangeCodeForSession(code!);

      if (exchangeError) {
        console.error("[auth/confirm] exchange error:", exchangeError.message);
        setErrorMsg(exchangeError.message);
        return;
      }

      const user = data?.session?.user;
      if (!user) {
        setErrorMsg("Session not established.");
        return;
      }

      const upsertRes = await fetch(withBasePath("/api/auth/profile-upsert"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user.id,
          email: user.email,
          metadata: user.user_metadata,
        }),
      }).catch((err) => {
        console.error("[auth/confirm] profile-upsert fetch failed:", err);
        return null;
      });
      if (upsertRes && !upsertRes.ok) {
        console.error("[auth/confirm] profile-upsert returned", upsertRes.status);
      }

      // Sync session to cookies so server-side pages (middleware, /cluster) can read it
      if (data?.session?.access_token && data?.session?.refresh_token) {
        const setSessionRes = await fetch(withBasePath("/api/auth/set-session"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          }),
        }).catch((err) => {
          console.error("[auth/confirm] set-session fetch failed:", err);
          return null;
        });
        if (setSessionRes && !setSessionRes.ok) {
          console.error("[auth/confirm] set-session returned", setSessionRes.status);
        }
      }

      // Clean URL only after successful auth
      const url = new URL(window.location.href);
      url.searchParams.delete("code");
      url.searchParams.delete("type");
      window.history.replaceState({}, "", url.toString());

      // router.push auto-prepends basePath — do NOT wrap with withBasePath()
      // or the URL becomes /c/<slug>/c/<slug>/cluster (double basePath → 404)
      router.push("/cluster");
    }

    run();
  }, [router]);

  if (errorMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <p className="text-rose-600 mb-2">Couldn&apos;t sign you in</p>
          <p className="text-sm text-stone-500">{errorMsg}</p>
          <a href={withBasePath("/")} className="text-husl-clio underline text-sm mt-4 inline-block">
            Back to sign in
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <p className="text-stone-500">Signing you in…</p>
      </div>
    </div>
  );
}
