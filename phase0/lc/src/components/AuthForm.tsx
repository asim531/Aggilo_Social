"use client";

import { useState, useEffect, type FormEvent, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { CLUSTER } from "@/lib/cluster";
import { withBasePath } from "@/lib/path";
import { track } from "@/lib/track";

type AuthMode = "signin" | "signup";
type AuthState = "idle" | "loading" | "success" | "error";
type SignupStep =
  | "email"
  | "nickname"
  | "gender"
  | "birth_year"
  | "city";

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "non_binary", label: "Non-binary" },
];

/**
 * AGGIL window for Long Conversation.
 * Birth years 1993–2003 → ages roughly 22–32 in 2025. The form does not
 * gate outside this range — anyone can join. We capture the year so
 * Scout can calibrate discovery briefs and so the Cluster Score signal
 * reflects who's actually here.
 */
const CURRENT_YEAR = new Date().getFullYear();
const BIRTH_YEARS = Array.from({ length: 50 }, (_, i) => CURRENT_YEAR - 18 - i);
const RECOMMENDED_RANGE: [number, number] = [
  CLUSTER.aggil.birthYearRange[0],
  CLUSTER.aggil.birthYearRange[1],
];

function AuthFormContent() {
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");

  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [gender, setGender] = useState("");
  const [birthYear, setBirthYear] = useState<number | "">("");
  const [city, setCity] = useState("");
  const [step, setStep] = useState<SignupStep>("email");
  const [state, setState] = useState<AuthState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [nicknameChecking, setNicknameChecking] = useState(false);

  useEffect(() => {
    if (urlError) setErrorMsg(urlError);
  }, [urlError]);

  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        window.location.href = withBasePath("/cluster");
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── SIGN IN: email-only → magic link ────────────────────────────
  async function handleSignIn(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setState("loading");
    setErrorMsg("");
    track("signin_submitted");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        // basePath-aware so magic links bounce back through the
        // publicly-rewritten URL (aggilo.in/c/long-conversation/auth/callback).
        emailRedirectTo: `${window.location.origin}${withBasePath("/auth/callback")}`,
        shouldCreateUser: false,
      },
    });

    if (error) {
      if (
        error.message.includes("Signups not allowed") ||
        error.message.includes("User not found")
      ) {
        setState("error");
        setErrorMsg("No account with that email. Try Create account instead.");
      } else {
        setState("error");
        setErrorMsg(error.message);
      }
    } else {
      setState("success");
      track("signin_link_sent");
    }
  }

  // ── SIGN UP: multi-step ──────────────────────────────────────────
  async function handleEmailSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setState("loading");
    setErrorMsg("");
    track("signup_email_submitted");
    try {
      const res = await fetch(withBasePath("/api/auth/check-email"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const { exists } = (await res.json()) as { exists: boolean };
      if (exists) {
        setState("success");
        track("signup_existing_email_redirected");
        return;
      }
    } catch {
      // Fall through to normal sign-up flow
    }
    setState("idle");
    setStep("nickname");
  }

  async function handleNicknameSubmit(e: FormEvent) {
    e.preventDefault();
    if (!nickname.trim()) return;
    if (nickname.trim().length < 2) {
      setErrorMsg("Nickname must be at least 2 characters.");
      return;
    }
    setErrorMsg("");
    setNicknameChecking(true);
    try {
      const res = await fetch(withBasePath("/api/auth/check-nickname"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: nickname.trim() }),
      });
      const { available } = (await res.json()) as { available: boolean };
      if (!available) {
        setErrorMsg("That nickname is already taken in this room. Pick another.");
        return;
      }
    } catch {
      // Fail open — allow through
    } finally {
      setNicknameChecking(false);
    }
    track("signup_nickname_chosen");
    setStep("gender");
  }

  function handleGenderSubmit(e: FormEvent) {
    e.preventDefault();
    if (!gender) return;
    track("signup_gender_chosen", { gender });
    setStep("birth_year");
  }

  function handleBirthYearSubmit(e: FormEvent) {
    e.preventDefault();
    if (!birthYear) return;
    track("signup_birth_year_chosen", { birth_year: birthYear });
    setStep("city");
  }

  function handleCitySubmit(e: FormEvent) {
    e.preventDefault();
    // City is optional — empty string is allowed.
    track("signup_city_submitted");
    sendOtp();
  }

  async function sendOtp() {
    setState("loading");
    setErrorMsg("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${window.location.origin}${withBasePath("/auth/callback")}`,
        data: {
          nickname: nickname.trim(),
          gender,
          birth_year: birthYear,
          country: city.trim() || null,
        },
      },
    });

    if (error) {
      setState("error");
      setErrorMsg(error.message);
    } else {
      setState("success");
      track("signup_link_sent");
    }
  }

  // ── SUCCESS ──────────────────────────────────────────────────────
  if (state === "success") {
    return (
      <div className="w-full">
        <div className="text-center p-6 rounded-xl bg-lc-card border border-stone-200">
          <p className="text-lc-ink font-medium text-lg mb-2">
            Check your email
          </p>
          <p className="text-sm text-lc-muted">
            We sent your sign-in link to{" "}
            <span className="font-medium text-lc-ink">{email}</span>. Open it
            in this browser and you&apos;ll be in.
          </p>
        </div>
      </div>
    );
  }

  // ── MODE TOGGLE ──────────────────────────────────────────────────
  return (
    <div className="w-full">
      <div className="flex rounded-lg bg-stone-100 border border-stone-200 p-1 mb-5">
        <button
          type="button"
          onClick={() => {
            setMode("signin");
            setStep("email");
            setErrorMsg("");
          }}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
            mode === "signin"
              ? "bg-lc-card text-lc-ink shadow-sm"
              : "text-lc-muted hover:text-lc-ink"
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
              ? "bg-lc-card text-lc-ink shadow-sm"
              : "text-lc-muted hover:text-lc-ink"
          }`}
        >
          Create account
        </button>
      </div>

      {/* ── SIGN IN ──────────────────────────────────────────────── */}
      {mode === "signin" && (
        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label
              htmlFor="signin-email"
              className="block text-sm font-medium text-lc-ink mb-1.5"
            >
              Your email
            </label>
            <input
              id="signin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-4 py-3 rounded-lg border border-stone-300 bg-lc-card focus:outline-none focus:ring-2 focus:ring-lc-clio focus:border-transparent text-lc-ink placeholder:text-stone-400"
            />
          </div>
          <button
            type="submit"
            disabled={!email.trim() || state === "loading"}
            className="w-full py-3 px-4 rounded-lg font-medium text-white bg-lc-clio hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {state === "loading" ? "Sending link…" : "Email me a sign-in link"}
          </button>
          {errorMsg && (
            <p className="text-rose-600 text-sm text-center bg-rose-50 p-2 rounded">
              {errorMsg}
            </p>
          )}
          <p className="text-xs text-lc-muted text-center">
            No password. We send a link that signs you in.
          </p>
        </form>
      )}

      {/* ── SIGN UP — email step ─────────────────────────────────── */}
      {mode === "signup" && step === "email" && (
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="signup-email"
              className="block text-sm font-medium text-lc-ink mb-1.5"
            >
              Your email
            </label>
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-4 py-3 rounded-lg border border-stone-300 bg-lc-card focus:outline-none focus:ring-2 focus:ring-lc-clio focus:border-transparent text-lc-ink placeholder:text-stone-400"
            />
          </div>
          <button
            type="submit"
            disabled={!email.trim() || state === "loading"}
            className="w-full py-3 px-4 rounded-lg font-medium text-white bg-lc-clio hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {state === "loading" ? "Checking…" : "Continue"}
          </button>
          {errorMsg && (
            <p className="text-rose-600 text-sm text-center bg-rose-50 p-2 rounded">
              {errorMsg}
            </p>
          )}
          <p className="text-xs text-lc-muted text-center">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => setMode("signin")}
              className="text-lc-clio underline hover:text-amber-700"
            >
              Sign in
            </button>
          </p>
        </form>
      )}

      {/* ── SIGN UP — nickname step ──────────────────────────────── */}
      {mode === "signup" && step === "nickname" && (
        <form onSubmit={handleNicknameSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="nickname"
              className="block text-sm font-medium text-lc-ink mb-1.5"
            >
              Choose a nickname
            </label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="How others will know you"
              required
              maxLength={30}
              className="w-full px-4 py-3 rounded-lg border border-stone-300 bg-lc-card focus:outline-none focus:ring-2 focus:ring-lc-clio focus:border-transparent text-lc-ink placeholder:text-stone-400"
            />
          </div>
          <p className="text-xs text-lc-muted">
            No real names. Your nickname is your entire presence here.
          </p>
          <button
            type="submit"
            disabled={!nickname.trim() || nicknameChecking}
            className="w-full py-3 px-4 rounded-lg font-medium text-white bg-lc-clio hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {nicknameChecking ? "Checking…" : "Continue"}
          </button>
          <button
            type="button"
            onClick={() => setStep("email")}
            className="w-full text-sm text-lc-muted hover:text-lc-ink"
          >
            Back
          </button>
          {errorMsg && (
            <p className="text-rose-600 text-sm text-center">{errorMsg}</p>
          )}
        </form>
      )}

      {/* ── SIGN UP — gender step ────────────────────────────────── */}
      {mode === "signup" && step === "gender" && (
        <form onSubmit={handleGenderSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-lc-ink mb-3">
              Your gender
            </label>
            <p className="text-xs text-lc-muted mb-3">
              Self-declared. This room is open to everyone — knowing the mix
              helps us keep it balanced.
            </p>
            <div className="space-y-2">
              {GENDER_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-3 p-3 rounded-lg border border-stone-300 bg-lc-card cursor-pointer hover:border-lc-clio transition-colors"
                >
                  <input
                    type="radio"
                    name="gender"
                    value={opt.value}
                    checked={gender === opt.value}
                    onChange={(e) => setGender(e.target.value)}
                    className="accent-lc-clio"
                  />
                  <span className="text-sm text-lc-ink">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
          <button
            type="submit"
            disabled={!gender}
            className="w-full py-3 px-4 rounded-lg font-medium text-white bg-lc-clio hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Continue
          </button>
          <button
            type="button"
            onClick={() => setStep("nickname")}
            className="w-full text-sm text-lc-muted hover:text-lc-ink"
          >
            Back
          </button>
          {errorMsg && (
            <p className="text-rose-600 text-sm text-center">{errorMsg}</p>
          )}
        </form>
      )}

      {/* ── SIGN UP — birth year step ────────────────────────────── */}
      {mode === "signup" && step === "birth_year" && (
        <form onSubmit={handleBirthYearSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="birth-year"
              className="block text-sm font-medium text-lc-ink mb-1.5"
            >
              Your birth year
            </label>
            <p className="text-xs text-lc-muted mb-3">
              This room was built for the {RECOMMENDED_RANGE[0]}–{RECOMMENDED_RANGE[1]} window
              (roughly 22–32 today). Anyone can join, but the conversation is calibrated for that range.
            </p>
            <select
              id="birth-year"
              value={birthYear}
              onChange={(e) =>
                setBirthYear(e.target.value === "" ? "" : parseInt(e.target.value, 10))
              }
              required
              className="w-full px-4 py-3 rounded-lg border border-stone-300 bg-lc-card focus:outline-none focus:ring-2 focus:ring-lc-clio focus:border-transparent text-lc-ink"
            >
              <option value="" disabled>
                Select your birth year
              </option>
              {BIRTH_YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={!birthYear}
            className="w-full py-3 px-4 rounded-lg font-medium text-white bg-lc-clio hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Continue
          </button>
          <button
            type="button"
            onClick={() => setStep("gender")}
            className="w-full text-sm text-lc-muted hover:text-lc-ink"
          >
            Back
          </button>
          {errorMsg && (
            <p className="text-rose-600 text-sm text-center">{errorMsg}</p>
          )}
        </form>
      )}

      {/* ── SIGN UP — city step (optional) ───────────────────────── */}
      {mode === "signup" && step === "city" && (
        <form onSubmit={handleCitySubmit} className="space-y-4">
          <div>
            <label
              htmlFor="city"
              className="block text-sm font-medium text-lc-ink mb-1.5"
            >
              Your city <span className="text-lc-muted font-normal">(optional)</span>
            </label>
            <p className="text-xs text-lc-muted mb-3">
              Where you&apos;re based. India-primary, but open to anyone. Skip this if you&apos;d rather not say.
            </p>
            <input
              id="city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Bangalore, Bhopal, Delhi"
              maxLength={64}
              className="w-full px-4 py-3 rounded-lg border border-stone-300 bg-lc-card focus:outline-none focus:ring-2 focus:ring-lc-clio focus:border-transparent text-lc-ink placeholder:text-stone-400"
            />
          </div>
          <button
            type="submit"
            disabled={state === "loading"}
            className="w-full py-3 px-4 rounded-lg font-medium text-white bg-lc-clio hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {state === "loading" ? "Sending link…" : "Enter Long Conversation"}
          </button>
          <button
            type="button"
            onClick={() => setStep("birth_year")}
            className="w-full text-sm text-lc-muted hover:text-lc-ink"
          >
            Back
          </button>
          {errorMsg && (
            <p className="text-rose-600 text-sm text-center">{errorMsg}</p>
          )}
        </form>
      )}
    </div>
  );
}

export default function AuthForm() {
  return (
    <Suspense fallback={<div className="w-full h-[300px]" />}>
      <AuthFormContent />
    </Suspense>
  );
}
