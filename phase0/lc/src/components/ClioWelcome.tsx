"use client";

/**
 * ClioWelcome — Long Conversation onboarding modal.
 *
 * Three-step modal that fires on a member's first session. Orients
 * without performing welcome. Uses the Clio and Sage character images
 * with micro-animations per step — same pattern as the MVP but with
 * LC's intimacy register and color tokens.
 *
 * Steps:
 *   1. Intro — Clio alone, pulsing ring. Greets by nickname.
 *   2. Agents — Clio appoints Sage with a beam animation.
 *   3. Dynamics — Clio and Sage in dialogue, alternating bubbles.
 *
 * Trigger: profile.onboarded === false.
 * On dismiss: parent stamps profile.onboarded = true.
 * Skippable from any step.
 * Privacy: data-clarity-mask="true".
 */

import { useState } from "react";
import Image from "next/image";

interface ClioWelcomeProps {
  nickname: string;
  onDismiss: () => void;
}

type StepKey = "intro" | "agents" | "dynamics";

interface Step {
  key: StepKey;
  title: string;
  body: React.ReactNode;
  accentFrom: string;
  accentTo: string;
  borderColor: string;
}

export default function ClioWelcome({ nickname, onDismiss }: ClioWelcomeProps) {
  const [step, setStep] = useState(0);

  const steps: Step[] = [
    {
      key: "intro",
      title: `Hey, ${nickname}.`,
      accentFrom: "from-amber-500",
      accentTo: "to-amber-600",
      borderColor: "border-amber-200",
      body: (
        <>
          <p className="mb-3">
            This is <strong>Long Conversation</strong>. The room you arrived
            in is for genuine connection — the kind that goes somewhere.
          </p>
          <p className="mb-3">
            No photos. No swiping. No mutual matches. The only thing anyone
            knows about you is what you choose to say. Words are your entire
            presence here, and that&apos;s the point.
          </p>
          <p className="text-lc-muted text-sm">
            Your nickname is your only identity. No real names are shown.
          </p>
        </>
      ),
    },
    {
      key: "agents",
      title: "There are two of us in here.",
      accentFrom: "from-teal-600",
      accentTo: "to-teal-700",
      borderColor: "border-teal-200",
      body: (
        <>
          <p className="mb-3">
            <span className="font-semibold text-lc-sage">Sage</span> is the
            room&apos;s anchor. She reads everything posted and speaks rarely
            — only when she has something genuine to add. She holds the
            register of the room. You&apos;ll see her in the Timeline.
          </p>
          <p className="mb-3">
            <span className="font-semibold text-lc-clio">Clio</span> is me.
            I&apos;m for you specifically — your guide, your private listener,
            the one who notices. Tap the button top-right whenever you want
            me. There&apos;s also a private mode that stays just between us.
          </p>
          <p className="text-lc-muted text-sm">
            Sage holds the room. I hold your experience of being in it.
          </p>
        </>
      ),
    },
    {
      key: "dynamics",
      title: "How this works.",
      accentFrom: "from-stone-600",
      accentTo: "to-stone-700",
      borderColor: "border-stone-200",
      body: (
        <>
          <p className="mb-3">
            Every interaction is a public Timeline post. No DMs yet, no
            follows, no likes. The conversation builds in the open — that&apos;s
            how something real becomes visible.
          </p>
          <p className="mb-3">
            Sage and I check in regularly about what this room could gain.
            You can read our working dialogue in the Workshop strip below the
            Timeline — collapsed by default; tap it when you&apos;re curious.
          </p>
          <p className="text-lc-muted text-sm">
            Patience is the pace. The right person is the one whose words you
            can&apos;t put down.
          </p>
        </>
      ),
    },
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300"
      data-clarity-mask="true"
      role="dialog"
      aria-modal="true"
      aria-labelledby="clio-welcome-title"
    >
      <div className="bg-lc-card rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Animated stage */}
        <div
          className={`bg-gradient-to-br ${current.accentFrom} ${current.accentTo} relative flex items-center justify-center py-8 overflow-hidden min-h-[180px]`}
        >
          {current.key === "intro" && <IntroStage />}
          {current.key === "agents" && <AgentsStage />}
          {current.key === "dynamics" && <DynamicsStage />}
        </div>

        {/* Header */}
        <div className={`px-6 pt-4 pb-0 border-b ${current.borderColor}`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] uppercase tracking-[0.18em] text-lc-muted font-medium">
              Aggilo · Long Conversation
            </span>
            <button
              type="button"
              onClick={onDismiss}
              className="text-xs text-lc-muted hover:text-lc-ink transition-colors"
              aria-label="Skip welcome"
            >
              Skip
            </button>
          </div>
          <h2
            id="clio-welcome-title"
            className="text-xl font-semibold text-lc-ink pb-4"
          >
            {current.title}
          </h2>
        </div>

        {/* Body */}
        <div className="px-6 py-5 text-sm text-lc-ink leading-relaxed">
          {current.body}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex items-center justify-between border-t border-stone-100 pt-4">
          <div className="flex gap-1.5" aria-hidden="true">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  i === step ? "bg-lc-clio w-3" : "bg-stone-200"
                }`}
              />
            ))}
          </div>
          <span className="sr-only">
            Step {step + 1} of {steps.length}
          </span>

          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="text-xs text-lc-muted hover:text-lc-ink transition-colors px-2 py-1"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={() => (isLast ? onDismiss() : setStep(step + 1))}
              className="px-4 py-2 bg-lc-clio text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors"
            >
              {isLast ? "Enter the room" : "Continue"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Animated stages ────────────────────────────────────────────────

/** Step 1: Clio alone, pulsing ring — present, ready. */
function IntroStage() {
  return (
    <div className="relative w-28 h-28">
      {/* Outer pulse ring */}
      <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" />
      {/* Inner soft ring */}
      <div className="absolute inset-2 rounded-full bg-white/10" />
      {/* Avatar */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Image
          src="/characters/clio.png"
          alt="Clio"
          fill
          className="object-contain drop-shadow-lg"
          priority
        />
      </div>
      <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-white/80 text-[10px] font-medium tracking-wide whitespace-nowrap">
        Clio · your guide
      </span>
    </div>
  );
}

/** Step 2: Clio appoints Sage — beam travels left to right. */
function AgentsStage() {
  return (
    <div className="relative w-full max-w-xs h-28 px-4">
      {/* Clio (left) */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-20 h-20">
        <Image
          src="/characters/clio.png"
          alt="Clio"
          fill
          className="object-contain drop-shadow-lg"
          priority
        />
        <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-white/80 text-[10px] font-medium whitespace-nowrap">
          Clio
        </span>
      </div>

      {/* Beam — glowing dot travels Clio → Sage */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-0.5 bg-white/20 rounded-full overflow-hidden">
        <span
          className="absolute inset-y-0 left-0 w-4 h-full bg-white/90 rounded-full"
          style={{
            animation: "beam-travel 1.4s ease-in-out infinite",
          }}
        />
      </div>

      {/* Sage (right) — fades in */}
      <div
        className="absolute right-4 top-1/2 -translate-y-1/2 w-20 h-20"
        style={{ animation: "sage-arrive 0.6s ease-out 0.5s both" }}
      >
        <Image
          src="/characters/sage.png"
          alt="Sage"
          fill
          className="object-contain drop-shadow-lg"
          priority
        />
        <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-white/80 text-[10px] font-medium whitespace-nowrap">
          Sage · Anchor
        </span>
        {/* Appointed badge */}
        <span
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white/90 text-teal-700 text-[9px] font-bold flex items-center justify-center"
          style={{ animation: "badge-pop 0.3s ease-out 1s both" }}
        >
          ✓
        </span>
      </div>

      <style jsx>{`
        @keyframes beam-travel {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(700%); }
        }
        @keyframes sage-arrive {
          from { opacity: 0; transform: translateY(-50%) scale(0.8); }
          to { opacity: 1; transform: translateY(-50%) scale(1); }
        }
        @keyframes badge-pop {
          from { opacity: 0; transform: scale(0); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

/** Step 3: Clio and Sage in dialogue — alternating chat bubbles. */
function DynamicsStage() {
  return (
    <div className="relative w-full max-w-xs h-28 px-4">
      {/* Clio bubble (fires first) */}
      <div
        className="absolute left-4 top-1 w-24 flex justify-center"
        style={{ animation: "bubble-in 0.4s ease-out 0.1s both" }}
      >
        <span className="px-2 py-1 rounded-full bg-amber-200/95 text-amber-900 text-[9px] font-medium shadow-sm whitespace-nowrap">
          What&apos;s missing?
        </span>
      </div>

      {/* Clio (left) */}
      <div className="absolute left-4 bottom-0 w-20 h-20">
        <Image
          src="/characters/clio.png"
          alt="Clio"
          fill
          className="object-contain drop-shadow-lg"
          priority
        />
      </div>

      {/* Sage bubble (fires second) */}
      <div
        className="absolute right-4 top-1 w-24 flex justify-center"
        style={{ animation: "bubble-in 0.4s ease-out 0.7s both" }}
      >
        <span className="px-2 py-1 rounded-full bg-teal-200/95 text-teal-900 text-[9px] font-medium shadow-sm whitespace-nowrap">
          A way to go deeper.
        </span>
      </div>

      {/* Sage (right) */}
      <div className="absolute right-4 bottom-0 w-20 h-20">
        <Image
          src="/characters/sage.png"
          alt="Sage"
          fill
          className="object-contain drop-shadow-lg"
          priority
        />
      </div>

      {/* Connecting line */}
      <div className="absolute left-1/2 bottom-10 -translate-x-1/2 w-20 h-0.5 bg-white/30 rounded-full" />

      <style jsx>{`
        @keyframes bubble-in {
          from { opacity: 0; transform: translateY(6px) scale(0.9); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
