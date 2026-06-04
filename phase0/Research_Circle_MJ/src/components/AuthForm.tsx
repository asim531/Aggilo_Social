"use client";

import { useState, useEffect, type FormEvent, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { createAuthClient } from "@/lib/supabase-auth";
import { withBasePath } from "@/lib/path";
import { track } from "@/lib/track";
import { CLUSTER } from "@/lib/cluster";

type AuthMode = "signin" | "signup";
type AuthState = "idle" | "loading" | "success" | "error";
type SignupStep =
  | "email"
  | "nickname"
  | "gender"
  | "birth_year"
  | "location";

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "non_binary", label: "Non-binary" },
];

/**
 * Birth year capture for AGGIL profile completion.
 * The form does not gate on age — anyone can join.
 * We capture the year so Scout can calibrate discovery briefs.
 */
const CURRENT_YEAR = new Date().getFullYear();
const BIRTH_YEARS = Array.from({ length: 50 }, (_, i) => CURRENT_YEAR - 18 - i);

function AuthFormContent({ compact = false }: { compact?: boolean }) {
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");

  const [mode, setMode] = useState<AuthMode>(
    searchParams.get("founder") === "tas" ? "signup" : "signin"
  );
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [nickname, setNickname] = useState("");
  const [gender, setGender] = useState(searchParams.get("gender") || "");
  const [birthYear, setBirthYear] = useState<number | "">(
    searchParams.get("birth_year") ? parseInt(searchParams.get("birth_year")!, 10) : ""
  );
  const [country, setCountry] = useState(searchParams.get("country") || "");
  const [city, setCity] = useState("");
  const [affirmAffiliation, setAffirmAffiliation] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [step, setStep] = useState<SignupStep>(
    searchParams.get("founder") === "tas" ? "nickname" : "email"
  );
  const [state, setState] = useState<AuthState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [nicknameChecking, setNicknameChecking] = useState(false);
  const [autoSwitched, setAutoSwitched] = useState(false);
  const [otpPending, setOtpPending] = useState(false);

  useEffect(() => {
    if (urlError) setErrorMsg(urlError);
  }, [urlError]);

  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Do not auto-redirect if in founder onboarding flow
      if (searchParams.get("founder") === "tas") return;

      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
        window.location.href = withBasePath("/cluster");
      }
    });
    return () => subscription.unsubscribe();
  }, [searchParams]);

  // ── SIGN IN: email-only → magic link ────────────────────────────
  async function handleSignIn(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setState("loading");
    setErrorMsg("");
    track("signin_submitted");

    let exists = false;
    try {
      const res = await fetch(withBasePath("/api/auth/check-email"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = (await res.json()) as { exists: boolean };
      exists = data.exists;
    } catch {
      setState("error");
      setErrorMsg("Something went wrong. Please try again.");
      return;
    }

    if (exists) {
      // Existing user — send magic link
      if (otpPending) return;
      setOtpPending(true);
      const authClient = createAuthClient();
      const { error } = await authClient.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${window.location.origin}${withBasePath("/auth/confirm")}`,
        },
      });
      setOtpPending(false);
      if (error) {
        setState("error");
        const msg = error.message.includes("security") || error.message.includes("58 seconds")
          ? "Please wait a minute before requesting another link."
          : error.message;
        setErrorMsg(msg);
        return;
      }
      setState("success");
      track("signin_link_sent");
      return;
    }

    // New user — seamlessly switch to signup flow
    setAutoSwitched(true);
    setMode("signup");
    setStep("nickname");
    setState("idle");
    track("signin_new_user_redirected");
  }

  // ── SIGN UP: multi-step ──────────────────────────────────────────
  async function handleEmailSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setState("loading");
    setErrorMsg("");
    track("signup_email_submitted");

    let exists = false;
    try {
      const res = await fetch(withBasePath("/api/auth/check-email"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = (await res.json()) as { exists: boolean };
      exists = data.exists;
    } catch {
      // Fall through to normal sign-up flow
    }

    if (exists) {
      // Email already registered — send sign-in link
      const authClient = createAuthClient();
      const { error } = await authClient.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${window.location.origin}${withBasePath("/auth/confirm")}`,
        },
      });
      if (error) {
        setState("error");
        const msg = error.message.includes("security") || error.message.includes("58 seconds")
          ? "Please wait a minute before requesting another link."
          : error.message;
        setErrorMsg(msg);
        return;
      }
      setState("success");
      track("signup_existing_email_redirected");
      return;
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
    setStep("location");
  }

  function handleLocationSubmit(e: FormEvent) {
    e.preventDefault();
    if (!country.trim()) return; // Country is compulsory
    track("signup_location_submitted");
    
    if (searchParams.get("founder") === "tas") {
      instantFounderLogin();
    } else {
      sendOtp();
    }
  }

  async function instantFounderLogin() {
    setState("loading");
    setErrorMsg("");

    try {
      const res = await fetch(withBasePath("/api/auth/founder-login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          nickname: nickname.trim(),
          gender,
          birth_year: birthYear,
          country: city.trim() ? `${city.trim()}, ${country.trim()}` : country.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setState("error");
        setErrorMsg(data.error || "Failed to log in as founder");
        return;
      }

      if (data.session) {
        const supabase = createClient();
        await supabase.auth.setSession(data.session);
        window.location.href = withBasePath("/cluster");
      }
    } catch (err) {
      setState("error");
      setErrorMsg("Network error occurred.");
    }
  }

  async function sendOtp() {
    if (otpPending) return;
    setOtpPending(true);
    setState("loading");
    setErrorMsg("");

    const authClient = createAuthClient();
    const { error } = await authClient.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${window.location.origin}${withBasePath("/auth/confirm")}`,
        data: {
          nickname: nickname.trim(),
          gender,
          birth_year: birthYear,
          country: city.trim() ? `${city.trim()}, ${country.trim()}` : country.trim(),
        },
      },
    });
    setOtpPending(false);

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
        <div className="text-center p-6 rounded-xl bg-husl-card dark:bg-[#14161a] border border-stone-200 dark:border-stone-800 transition-colors">
          <p className="text-husl-ink dark:text-white font-medium text-lg mb-2">
            Check your email
          </p>
          <p className="text-sm text-husl-muted dark:text-stone-400">
            We sent your sign-in link to{" "}
            <span className="font-medium text-husl-ink dark:text-white">{email}</span>. Open it
            in this browser and you&apos;ll be in.
          </p>
        </div>
      </div>
    );
  }

  // ── MODE TOGGLE ──────────────────────────────────────────────────
  return (
    <div className="w-full">
      <div className="flex rounded-lg bg-stone-100 dark:bg-[#14161a] border border-stone-200 dark:border-stone-800 p-1 mb-5 transition-colors">
        <button
          type="button"
          onClick={() => {
            setMode("signin");
            setStep("email");
            setErrorMsg("");
            setAutoSwitched(false);
          }}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
            mode === "signin"
              ? "bg-husl-card dark:bg-[#1a1c20] text-husl-ink dark:text-white shadow-sm"
              : "text-husl-muted dark:text-stone-400 hover:text-husl-ink dark:hover:text-white"
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
            setAutoSwitched(false);
          }}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
            mode === "signup"
              ? "bg-husl-card dark:bg-[#1a1c20] text-husl-ink dark:text-white shadow-sm"
              : "text-husl-muted dark:text-stone-400 hover:text-husl-ink dark:hover:text-white"
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
              className="block text-sm font-medium text-husl-ink mb-1.5"
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
              className="w-full px-4 py-3 rounded-lg border border-stone-300 dark:border-stone-700 bg-husl-card dark:bg-[#1a1c20] focus:outline-none focus:ring-2 focus:ring-husl-clio focus:border-transparent text-husl-ink dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-500 transition-colors"
            />
          </div>
          {!compact && (
            <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 p-3 transition-colors">
              <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                <span className="font-semibold">Important:</span> Open the link from your email in this same browser and device. If you switch, you&apos;ll have to start over.
              </p>
            </div>
          )}
          <button
            type="submit"
            disabled={!email.trim() || state === "loading"}
            className="w-full py-3 px-4 rounded-lg font-medium text-white bg-husl-clio hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {state === "loading" ? "Sending link…" : "Email me a sign-in link"}
          </button>
          {errorMsg && (
            <p className="text-rose-600 text-sm text-center bg-rose-50 p-2 rounded">
              {errorMsg}
            </p>
          )}
          {!compact && (
            <p className="text-xs text-husl-muted text-center">
              No password. We send a link that signs you in.
            </p>
          )}
        </form>
      )}

      {/* ── SIGN UP — email step ─────────────────────────────────── */}
      {mode === "signup" && step === "email" && (
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="signup-email"
              className="block text-sm font-medium text-husl-ink mb-1.5"
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
              className="w-full px-4 py-3 rounded-lg border border-stone-300 dark:border-stone-700 bg-husl-card dark:bg-[#1a1c20] focus:outline-none focus:ring-2 focus:ring-husl-clio focus:border-transparent text-husl-ink dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={!email.trim() || state === "loading"}
            className="w-full py-3 px-4 rounded-lg font-medium text-white bg-husl-clio hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {state === "loading" ? "Checking…" : "Continue"}
          </button>
          {errorMsg && (
            <p className="text-rose-600 text-sm text-center bg-rose-50 p-2 rounded">
              {errorMsg}
            </p>
          )}
          {!compact && (
            <p className="text-xs text-husl-muted text-center">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setMode("signin")}
                className="text-husl-clio underline hover:text-amber-700"
              >
                Sign in
              </button>
            </p>
          )}
        </form>
      )}

      {/* ── SIGN UP — nickname step ──────────────────────────────── */}
      {mode === "signup" && step === "nickname" && (
        <form onSubmit={handleNicknameSubmit} className="space-y-4">
          {(searchParams.get("founder") === "tas" || autoSwitched) && (
            <div className="bg-husl-card dark:bg-[#14161a] border border-husl-clio/20 dark:border-husl-clio/10 rounded-lg p-4 mb-6 transition-colors">
              {searchParams.get("founder") === "tas" ? (
                <>
                  <p className="text-sm text-husl-ink dark:text-stone-200 leading-relaxed">
                    Tas, we have already filled the information that you provided us. We only need you to choose your suitable nickname.
                  </p>
                  <p className="text-sm text-husl-clio italic mt-2">— Clio</p>
                </>
              ) : (
                <>
                  <p className="text-sm text-husl-ink dark:text-stone-200 leading-relaxed">
                    Welcome! It looks like you&apos;re new here. Let&apos;s set up your profile.
                  </p>
                  <p className="text-sm text-husl-clio italic mt-2">— Clio</p>
                </>
              )}
            </div>
          )}
          <div>
            <label
              htmlFor="nickname"
              className="block text-sm font-medium text-husl-ink mb-1.5"
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
              className="w-full px-4 py-3 rounded-lg border border-stone-300 dark:border-stone-700 bg-husl-card dark:bg-[#1a1c20] focus:outline-none focus:ring-2 focus:ring-husl-clio focus:border-transparent text-husl-ink dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-500 transition-colors"
            />
          </div>
          <p className="text-xs text-husl-muted">
            No real names. Your nickname is your entire presence here.
          </p>
          <button
            type="submit"
            disabled={!nickname.trim() || nicknameChecking}
            className="w-full py-3 px-4 rounded-lg font-medium text-white bg-husl-clio hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {nicknameChecking ? "Checking…" : "Continue"}
          </button>
          <button
            type="button"
            onClick={() => setStep("email")}
            className="w-full text-sm text-husl-muted hover:text-husl-ink"
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
            <label className="block text-sm font-medium text-husl-ink mb-3">
              Your gender
            </label>
            <p className="text-xs text-husl-muted mb-3">
              Self-declared. This room is open to everyone — knowing the mix
              helps us keep it balanced.
            </p>
            <div className="space-y-2">
              {GENDER_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-3 p-3 rounded-lg border border-stone-300 dark:border-stone-700 bg-husl-card dark:bg-[#1a1c20] cursor-pointer hover:border-husl-clio transition-colors"
                >
                  <input
                    type="radio"
                    name="gender"
                    value={opt.value}
                    checked={gender === opt.value}
                    onChange={(e) => setGender(e.target.value)}
                    className="accent-husl-clio"
                  />
                  <span className="text-sm text-husl-ink dark:text-stone-200">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
          <button
            type="submit"
            disabled={!gender}
            className="w-full py-3 px-4 rounded-lg font-medium text-white bg-husl-clio hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Continue
          </button>
          <button
            type="button"
            onClick={() => setStep("nickname")}
            className="w-full text-sm text-husl-muted hover:text-husl-ink"
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
              className="block text-sm font-medium text-husl-ink mb-3"
            >
              Your birth year
            </label>
            <select
              id="birth-year"
              value={birthYear}
              onChange={(e) =>
                setBirthYear(e.target.value === "" ? "" : parseInt(e.target.value, 10))
              }
              required
              className="w-full px-4 py-3 rounded-lg border border-stone-300 dark:border-stone-700 bg-husl-card dark:bg-[#1a1c20] focus:outline-none focus:ring-2 focus:ring-husl-clio focus:border-transparent text-husl-ink dark:text-white transition-colors"
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
            className="w-full py-3 px-4 rounded-lg font-medium text-white bg-husl-clio hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Continue
          </button>
          <button
            type="button"
            onClick={() => setStep("gender")}
            className="w-full text-sm text-husl-muted hover:text-husl-ink"
          >
            Back
          </button>
          {errorMsg && (
            <p className="text-rose-600 text-sm text-center">{errorMsg}</p>
          )}
        </form>
      )}

      {/* ── SIGN UP — location step ────────────────────────────── */}
      {mode === "signup" && step === "location" && (
        <form onSubmit={handleLocationSubmit} className="space-y-4">
          <div className="rounded-lg bg-stone-50 dark:bg-[#14161a] border border-stone-200 dark:border-stone-700 p-4 space-y-3">
            <div>
              <label className="block text-xs uppercase tracking-wider text-husl-muted font-semibold mb-1">
                Institution
              </label>
              <p className="text-sm text-husl-ink dark:text-stone-200 font-medium">
                {CLUSTER.institution}
              </p>
            </div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={affirmAffiliation}
                onChange={(e) => setAffirmAffiliation(e.target.checked)}
                className="accent-husl-clio mt-0.5"
                required
              />
              <span className="text-sm text-husl-ink dark:text-stone-200 leading-snug">
                I confirm I am affiliated with this institution
              </span>
            </label>
          </div>

          <div className="rounded-lg bg-stone-50 dark:bg-[#14161a] border border-stone-200 dark:border-stone-700 p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="accent-husl-clio mt-0.5"
                required
              />
              <span className="text-xs text-husl-ink dark:text-stone-200 leading-snug">
                I agree to the <a href="/terms" target="_blank" className="text-husl-clio underline hover:text-amber-700">Terms of Service</a> and <a href="/privacy" target="_blank" className="text-husl-clio underline hover:text-amber-700">Privacy Policy</a>. I understand that my posts and profile are visible to other members of this research circle, and that Aggilo processes my data in accordance with the Information Technology Act, 2000 and the Digital Personal Data Protection Act, 2023 of India.
              </span>
            </label>
          </div>

          <div>
            <label
              htmlFor="country"
              className="block text-sm font-medium text-husl-ink mb-1.5"
            >
              Your country
            </label>
            <select
              id="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-stone-300 dark:border-stone-700 bg-husl-card dark:bg-[#1a1c20] focus:outline-none focus:ring-2 focus:ring-husl-clio focus:border-transparent text-husl-ink dark:text-white mb-4 transition-colors"
            >
              <option value="" disabled>Select a country</option>
              <option value="India">India</option>
              <option value="United States">United States</option>
              <option value="United Kingdom">United Kingdom</option>
              <option value="Canada">Canada</option>
              <option value="Australia">Australia</option>
              <option value="Singapore">Singapore</option>
              <option value="United Arab Emirates">United Arab Emirates</option>
              <option value="Other">Other</option>
            </select>
            
            <label
              htmlFor="city"
              className="block text-sm font-medium text-husl-ink mb-1.5"
            >
              Your city <span className="text-husl-muted font-normal">(optional)</span>
            </label>
            <input
              id="city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Bangalore, London, New York"
              maxLength={64}
              className="w-full px-4 py-3 rounded-lg border border-stone-300 dark:border-stone-700 bg-husl-card dark:bg-[#1a1c20] focus:outline-none focus:ring-2 focus:ring-husl-clio focus:border-transparent text-husl-ink dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-500 transition-colors"
            />
          </div>
          {!compact && (
            <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 p-3 transition-colors">
              <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                <span className="font-semibold">Important:</span> Open the link from your email in this same browser and device. If you switch, you&apos;ll have to start over.
              </p>
            </div>
          )}
          <button
            type="submit"
            disabled={state === "loading" || !country.trim() || !affirmAffiliation || !acceptedTerms}
            className="w-full py-3 px-4 rounded-lg font-medium text-white bg-husl-clio hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {state === "loading" ? "Sending link…" : "Enter Research Circle MJ"}
          </button>
          <button
            type="button"
            onClick={() => setStep("birth_year")}
            className="w-full text-sm text-husl-muted hover:text-husl-ink"
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

export default function AuthForm({ compact = false }: { compact?: boolean }) {
  return (
    <Suspense fallback={<div className="w-full h-[300px]" />}>
      <AuthFormContent compact={compact} />
    </Suspense>
  );
}
