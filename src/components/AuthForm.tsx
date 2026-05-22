"use client";

import { useState, useEffect, type FormEvent, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import {
  detectCountryFromGeolocation,
  isIndia,
  SOUTH_SE_ASIA_COUNTRIES,
} from "@/lib/country-detect";

type AuthMode = "signin" | "signup";
type AuthState = "idle" | "loading" | "success" | "error";
type SignupStep =
  | "email"
  | "nickname"
  | "gender"
  | "country"
  | "geo_block"
  | "beta_disclosure"
  | "waitlist";

const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Argentina", "Australia", "Austria",
  "Bahrain", "Bangladesh", "Belgium", "Bhutan", "Bosnia and Herzegovina",
  "Brazil", "Brunei", "Cambodia", "Canada", "Chad", "China", "Colombia",
  "Comoros", "Denmark", "Djibouti", "Egypt", "Eritrea", "Ethiopia",
  "Finland", "France", "Gambia", "Germany", "Ghana", "Guinea",
  "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy",
  "Japan", "Jordan", "Kazakhstan", "Kenya", "Kuwait", "Kyrgyzstan",
  "Laos", "Lebanon", "Libya", "Malaysia", "Maldives", "Mali",
  "Mauritania", "Mexico", "Morocco", "Myanmar", "Nepal", "Netherlands",
  "New Zealand", "Niger", "Nigeria", "Norway", "Oman", "Pakistan",
  "Palestine", "Philippines", "Poland", "Portugal", "Qatar",
  "Russia", "Saudi Arabia", "Senegal", "Sierra Leone", "Singapore",
  "Somalia", "South Africa", "South Korea", "Spain", "Sri Lanka",
  "Sudan", "Sweden", "Switzerland", "Syria", "Tajikistan", "Tanzania",
  "Thailand", "Timor-Leste", "Tunisia", "Turkey", "Turkmenistan",
  "Uganda", "United Arab Emirates", "United Kingdom", "United States",
  "Uzbekistan", "Vietnam", "Yemen", "Other",
];

function AuthFormContent() {
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");
  // ?ref=<slug> is set when a visitor arrives from a public cluster
  // preview (/c/<slug>). We use it for two things: (1) so non-fits
  // produce a demand signal pointing at the right cluster, and (2)
  // so the success copy can be cluster-specific in a future iteration.
  const refSlug = searchParams.get("ref");

  const [mode, setMode] = useState<AuthMode>(refSlug ? "signup" : "signin");
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [gender, setGender] = useState("");
  const [country, setCountry] = useState("");
  const [detectingCountry, setDetectingCountry] = useState(false);
  const [step, setStep] = useState<SignupStep>("email");
  const [state, setState] = useState<AuthState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [gpsConsent, setGpsConsent] = useState<"unknown" | "asked" | "granted" | "denied">("unknown");

  useEffect(() => {
    if (urlError) setErrorMsg(urlError);
  }, [urlError]);

  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        window.location.href = "/cluster";
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Country detection is consent-based ONLY. We do NOT run passive IP
  // detection on entering the country step. The user explicitly taps
  // "Use my location to detect country" to invoke geolocation, and the
  // browser handles the consent prompt. Per Senior UX review.

  async function handleUseGps() {
    setGpsConsent("asked");
    setDetectingCountry(true);
    const detected = await detectCountryFromGeolocation();
    if (detected) {
      setCountry(detected);
      setGpsConsent("granted");
    } else {
      setGpsConsent("denied");
    }
    setDetectingCountry(false);
  }

  // ── SIGN IN: email-only → magic link ────────────────────────────────
  async function handleSignIn(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setState("loading");
    setErrorMsg("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        shouldCreateUser: false,
      },
    });

    if (error) {
      // If user doesn't exist yet, nudge them to sign up
      if (error.message.includes("Signups not allowed") || error.message.includes("User not found")) {
        setState("error");
        setErrorMsg("No account with that email. Try Create account instead.");
      } else {
        setState("error");
        setErrorMsg(error.message);
      }
    } else {
      setState("success");
    }
  }

  // ── SIGN UP: multi-step ─────────────────────────────────────────────
  async function handleEmailSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    // Check if this email already has an account. If so, we already sent
    // them a magic link via the check-email route — show the success screen
    // with a note that they're being signed in, not signed up.
    setState("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const { exists } = await res.json();
      if (exists) {
        // Magic link already sent by the check-email route
        setState("success");
        return;
      }
    } catch {
      // Network error — fall through to normal sign-up flow
    }
    setState("idle");
    setStep("nickname");
  }

  function handleNicknameSubmit(e: FormEvent) {
    e.preventDefault();
    if (!nickname.trim()) return;
    if (nickname.trim().length < 2) {
      setErrorMsg("Nickname must be at least 2 characters.");
      return;
    }
    setErrorMsg("");
    setStep("gender");
  }

  function handleGenderSubmit(e: FormEvent) {
    e.preventDefault();
    if (gender !== "woman") {
      // AGGIL mismatch — record a demand signal so platform admin knows
      // a non-fit visitor came in via this slug. Best-effort, never blocks.
      void fetch("/api/demand-signals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_slug: refSlug ?? "sisters-in-dua",
          email: email.trim() || undefined,
          visitor_gender: gender,
          free_text_note: "Stranger arrived on a women-only cluster preview.",
        }),
      }).catch(() => undefined);
      setStep("waitlist");
      return;
    }
    setStep("country");
  }

  function handleCountrySubmit(e: FormEvent) {
    e.preventDefault();
    if (!country) return;

    // Hard geographic restriction: Sisters in Dua MVP is India-only
    if (!isIndia(country)) {
      // Record the non-fit so we know which countries are knocking.
      void fetch("/api/demand-signals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_slug: refSlug ?? "sisters-in-dua",
          email: email.trim() || undefined,
          visitor_country: country,
          visitor_gender: gender || undefined,
          free_text_note: `Country ${country} not yet in scope for this cluster.`,
        }),
      }).catch(() => undefined);
      setStep("geo_block");
      return;
    }

    // India-region beta acknowledgement still applies (just in case the
    // country list expands later); for India directly, send OTP.
    const needsBetaDisclosure = !SOUTH_SE_ASIA_COUNTRIES.includes(country);
    if (needsBetaDisclosure) {
      setStep("beta_disclosure");
      return;
    }
    sendOtp();
  }

  async function sendOtp() {
    setState("loading");
    setErrorMsg("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          nickname: nickname.trim(),
          gender: gender,
          country: country,
        },
      },
    });

    if (error) {
      setState("error");
      setErrorMsg(error.message);
    } else {
      setState("success");
    }
  }

  // ── SUCCESS: shared between sign-in and sign-up ─────────────────────
  if (state === "success") {
    const isExistingUser = mode === "signup" && step === "email";
    return (
      <div className="w-full max-w-sm mx-auto">
        <div className="text-center p-6 rounded-xl bg-emerald-900/30 border border-emerald-700/50">
          <p className="text-emerald-300 font-medium text-lg mb-2">
            Check your email
          </p>
          <p className="text-emerald-400/70 text-sm mb-2">
            We sent your sign-in link to{" "}
            <span className="font-medium text-emerald-300">{email}</span>.
            Click it from any device — we&apos;ll be ready when you arrive.
          </p>
          {isExistingUser && (
            <p className="text-emerald-500/60 text-xs mt-2">
              Looks like you already have an account — we sent you a sign-in link instead.
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── MODE TOGGLE ─────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="flex rounded-lg bg-[#0f1310] border border-gray-800 p-1 mb-5">
        <button
          type="button"
          onClick={() => {
            setMode("signin");
            setStep("email");
            setErrorMsg("");
          }}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
            mode === "signin"
              ? "bg-emerald-700 text-white"
              : "text-gray-500 hover:text-gray-300"
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("signup");
            setStep("email");
            setErrorMsg("");
          }}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
            mode === "signup"
              ? "bg-emerald-700 text-white"
              : "text-gray-500 hover:text-gray-300"
          }`}
        >
          Create account
        </button>
      </div>

      {/* ── SIGN IN MODE ──────────────────────────────────────────────── */}
      {mode === "signin" && (
        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label htmlFor="signin-email" className="block text-sm font-medium text-gray-400 mb-1.5">
              Your email
            </label>
            <input
              id="signin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-700 bg-[#11140f]
                         focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent
                         text-white placeholder:text-gray-600"
            />
          </div>
          <button
            type="submit"
            disabled={!email.trim() || state === "loading"}
            className="w-full py-3 px-4 rounded-lg font-medium text-white
                       bg-emerald-700 hover:bg-emerald-600
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors duration-200"
          >
            {state === "loading" ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Sending link...
              </span>
            ) : (
              "Email me a sign-in link"
            )}
          </button>
          {errorMsg && <p className="text-red-400 text-sm text-center bg-red-900/20 p-2 rounded">{errorMsg}</p>}
          <p className="text-xs text-gray-600 text-center">
            No password. We send a link that signs you in.
          </p>
        </form>
      )}

      {/* ── SIGN UP MODE — multi-step ─────────────────────────────────── */}
      {mode === "signup" && step === "email" && (
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div>
            <label htmlFor="signup-email" className="block text-sm font-medium text-gray-400 mb-1.5">
              Your email
            </label>
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-700 bg-[#11140f]
                         focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent
                         text-white placeholder:text-gray-600"
            />
          </div>
          <button
            type="submit"
            disabled={!email.trim() || state === "loading"}
            className="w-full py-3 px-4 rounded-lg font-medium text-white
                       bg-emerald-700 hover:bg-emerald-600
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors duration-200"
          >
            {state === "loading" ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Checking...
              </span>
            ) : (
              "Continue"
            )}
          </button>
          {errorMsg && <p className="text-red-400 text-sm text-center bg-red-900/20 p-2 rounded">{errorMsg}</p>}
          <p className="text-xs text-gray-600 text-center">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => setMode("signin")}
              className="text-emerald-400 underline hover:text-emerald-300"
            >
              Sign in
            </button>
          </p>
        </form>
      )}

      {mode === "signup" && step === "nickname" && (
        <form onSubmit={handleNicknameSubmit} className="space-y-4">
          <div>
            <label htmlFor="nickname" className="block text-sm font-medium text-gray-400 mb-1.5">
              Choose a nickname
            </label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="How sisters will know you"
              required
              maxLength={30}
              className="w-full px-4 py-3 rounded-lg border border-gray-700 bg-[#11140f]
                         focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent
                         text-white placeholder:text-gray-600"
            />
          </div>
          <p className="text-xs text-gray-500">
            Nicknames let you speak freely. Your real identity is always private.
          </p>
          <button
            type="submit"
            disabled={!nickname.trim()}
            className="w-full py-3 px-4 rounded-lg font-medium text-white
                       bg-emerald-700 hover:bg-emerald-600
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors duration-200"
          >
            Continue
          </button>
          <button type="button" onClick={() => setStep("email")} className="w-full text-sm text-gray-500 hover:text-gray-400">
            Back
          </button>
          {errorMsg && <p className="text-red-400 text-sm text-center">{errorMsg}</p>}
        </form>
      )}

      {mode === "signup" && step === "gender" && (
        <form onSubmit={handleGenderSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-3">
              To protect the vulnerability of the sisters inside, we require everyone to verify this space is for women only. Thank you for helping us keep it safe.
            </label>
            <div className="space-y-2">
              {[
                { value: "woman", label: "Woman" },
                { value: "man", label: "Man" },
                { value: "other", label: "Prefer not to say / Other" },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-700 bg-[#11140f] cursor-pointer hover:border-emerald-600 transition-colors"
                >
                  <input
                    type="radio"
                    name="gender"
                    value={opt.value}
                    checked={gender === opt.value}
                    onChange={(e) => setGender(e.target.value)}
                    className="accent-emerald-600"
                  />
                  <span className="text-sm text-gray-300">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
          <button
            type="submit"
            disabled={!gender}
            className="w-full py-3 px-4 rounded-lg font-medium text-white
                       bg-emerald-700 hover:bg-emerald-600
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors duration-200"
          >
            Continue
          </button>
          <button type="button" onClick={() => setStep("nickname")} className="w-full text-sm text-gray-500 hover:text-gray-400">
            Back
          </button>
          {errorMsg && <p className="text-red-400 text-sm text-center">{errorMsg}</p>}
        </form>
      )}

      {mode === "signup" && step === "country" && (
        <form onSubmit={handleCountrySubmit} className="space-y-4">
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-400 mb-1.5">
              Where are you based?
            </label>
            <p className="text-[11px] text-gray-500 leading-relaxed mb-3">
              Sisters in Dua is currently open to sisters in India only. We use your country only for this cluster — never your address, coordinates, or anything more specific.
            </p>

            {/* Lead with consent-based GPS — privacy-preserving option first */}
            {gpsConsent === "unknown" && !country && (
              <button
                type="button"
                onClick={handleUseGps}
                className="w-full mb-3 px-4 py-2.5 rounded-lg border border-emerald-700/50
                           bg-emerald-900/20 hover:bg-emerald-900/40 text-sm
                           text-emerald-300 transition-colors flex items-center justify-center gap-2"
                disabled={detectingCountry}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {detectingCountry ? "Detecting from your location..." : "Use my location to detect country"}
              </button>
            )}

            <select
              id="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              required
              className={`w-full px-4 py-3 rounded-lg border bg-[#11140f]
                         focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent
                         text-white ${
                           country && !isIndia(country)
                             ? "border-amber-700/60"
                             : "border-gray-700"
                         }`}
            >
              <option value="" disabled>
                {detectingCountry ? "Detecting..." : "Or pick from the list"}
              </option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {gpsConsent === "denied" && (
              <p className="mt-1.5 text-[11px] text-amber-400 leading-relaxed">
                Couldn&apos;t detect your country from your device. This usually means location access was declined or your browser blocked it. No problem — pick from the list above.
              </p>
            )}
            {gpsConsent === "granted" && country && (
              <p className="mt-1.5 text-[11px] text-emerald-400">
                Detected: <span className="font-medium">{country}</span>. You can change it if this isn&apos;t right.
              </p>
            )}
          </div>

          {/* Inline geo-block — visible AS the user selects, not after submit */}
          {country && !isIndia(country) && (
            <div className="p-4 rounded-lg bg-[#11140f] border border-amber-700/50">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-amber-400">🌍</span>
                <span className="text-amber-300 text-sm font-semibold">
                  Coming to {country} soon
                </span>
              </div>
              <p className="text-gray-400 text-xs leading-relaxed">
                Sisters in Dua is open to sisters in India only for now. Continue to add{" "}
                <span className="text-gray-300">{email}</span> to our waitlist — we&apos;ll write back when a space opens for {country}.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={!country || state === "loading"}
            className="w-full py-3 px-4 rounded-lg font-medium text-white
                       bg-emerald-700 hover:bg-emerald-600
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors duration-200"
          >
            {state === "loading" ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Sending link...
              </span>
            ) : country && !isIndia(country) ? (
              "Join the waitlist"
            ) : (
              "Enter Sisters in Dua"
            )}
          </button>
          <button type="button" onClick={() => setStep("gender")} className="w-full text-sm text-gray-500 hover:text-gray-400">
            Back
          </button>
          {errorMsg && <p className="text-red-400 text-sm text-center">{errorMsg}</p>}
        </form>
      )}

      {/* ── GEO BLOCK — non-India users ───────────────────────────────── */}
      {mode === "signup" && step === "geo_block" && (
        <div className="space-y-4">
          <div className="p-6 rounded-xl bg-[#11140f] border border-amber-700/50">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-amber-400 text-lg">🌍</span>
              <span className="font-semibold text-amber-300 text-sm">Coming to your region soon</span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed mb-3">
              Sisters in Dua is currently open to sisters in India only. We&apos;re focused on serving this region well before opening to others.
            </p>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              We&apos;ve added <span className="text-gray-300 font-medium">{email}</span> to our waitlist. We&apos;ll write back when a Sisters in Dua space opens for {country || "your region"}.
            </p>
            <button
              type="button"
              onClick={() => setStep("country")}
              className="w-full text-sm text-gray-500 hover:text-gray-400"
            >
              Choose a different country
            </button>
          </div>
        </div>
      )}

      {mode === "signup" && step === "beta_disclosure" && (
        <div className="space-y-4">
          <div className="p-6 rounded-xl bg-[#11140f] border border-amber-700/50">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-amber-400 text-lg">⚠</span>
              <span className="font-semibold text-amber-300 text-sm">Beta community</span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed mb-3">
              Sisters in Dua is in early beta. The community is small and growing. Features evolve in real time.
            </p>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              By joining, you understand this is a work in progress. Your patience and feedback shape the space for sisters who come after you.
            </p>
            <button
              onClick={() => sendOtp()}
              disabled={state === "loading"}
              className="w-full py-3 px-4 rounded-lg font-medium text-white
                         bg-emerald-700 hover:bg-emerald-600
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors duration-200"
            >
              {state === "loading" ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending link...
                </span>
              ) : (
                "I understand — let me in"
              )}
            </button>
            <button onClick={() => setStep("country")} className="w-full mt-2 text-sm text-gray-500 hover:text-gray-400">
              Back
            </button>
          </div>
          {errorMsg && <p className="text-red-400 text-sm text-center">{errorMsg}</p>}
        </div>
      )}

      {mode === "signup" && step === "waitlist" && (
        <div className="space-y-4">
          <div className="text-center p-6 rounded-xl bg-[#11140f] border border-gray-700">
            <p className="text-gray-300 font-medium text-lg mb-3">You&apos;re on the waitlist</p>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              Sisters in Dua is a women-only cluster. <a href="https://aggilo.in" target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline hover:text-emerald-300">Aggilo</a> is launching new invite-only clusters soon (including Brothers in Deen and more).
            </p>
            <p className="text-gray-400 text-sm leading-relaxed">
              We&apos;ve added <span className="text-gray-300 font-medium">{email}</span> to the platform waitlist. We&apos;ll notify you when a cluster opens that fits you.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AuthForm() {
  return (
    <Suspense fallback={<div className="w-full max-w-sm mx-auto h-[300px]" />}>
      <AuthFormContent />
    </Suspense>
  );
}
