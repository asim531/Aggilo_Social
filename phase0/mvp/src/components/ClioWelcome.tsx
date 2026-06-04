"use client";

import { useState } from "react";
import Image from "next/image";

interface ClioWelcomeProps {
  nickname: string;
  onDismiss: () => void;
}

type StepKey = "intro" | "appoint" | "collaborate";

export default function ClioWelcome({ nickname, onDismiss }: ClioWelcomeProps) {
  const [step, setStep] = useState(0);

  const steps: Array<{
    key: StepKey;
    title: string;
    body: string;
    accent: string;
  }> = [
    {
      key: "intro",
      title: `Assalamu Alaikum, ${nickname}`,
      body: "I'm Clio. I help every member find their way around. I'm always one tap away — top-right of any cluster, or open a private chat with me anytime — a conversation that stays just between you and me.",
      accent: "bg-amber-500",
    },
    {
      key: "appoint",
      title: "Meet Sage — your cluster's Anchor",
      body: "I appointed Sage to anchor this room. She reads every message, keeps content grounded in verified sources, and surfaces a dua when the room calls for one. Address her directly with @Sage — she always responds.",
      accent: "bg-aggilo-sage",
    },
    {
      key: "collaborate",
      title: "How we work together",
      body: "Sage and I check in regularly — you'll see our thoughts in the panel above the Timeline. We talk about what's helping, what's missing, and how to make this room better for you. The Admin and Managers hold guidance authority for fiqh and rulings. Every reference is verified. Your nickname is the only identity shown.",
      accent: "bg-aggilo-deep",
    },
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in duration-300">
        {/* Animated stage — different per step */}
        <div className={`${current.accent} relative flex items-center justify-center py-8 overflow-hidden min-h-[200px]`}>
          {current.key === "intro" && <IntroStage />}
          {current.key === "appoint" && <AppointStage />}
          {current.key === "collaborate" && <CollaborateStage />}
        </div>

        <div className="px-6 py-6">
          <h2 className="text-xl font-bold text-aggilo-deep mb-3">
            {current.title}
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            {current.body}
          </p>
        </div>

        <div className="px-6 pb-6 flex items-center justify-between">
          <div className="flex gap-2">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === step ? "bg-aggilo-deep" : "bg-gray-200"
                }`}
              />
            ))}
          </div>

          {isLast ? (
            <button
              onClick={onDismiss}
              className="px-6 py-2.5 bg-aggilo-deep text-white text-sm font-medium rounded-lg hover:bg-aggilo-mid transition-colors"
            >
              Enter the room
            </button>
          ) : (
            <button
              onClick={() => setStep(step + 1)}
              className="px-6 py-2.5 bg-aggilo-deep text-white text-sm font-medium rounded-lg hover:bg-aggilo-mid transition-colors"
            >
              Continue
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Animated stages ────────────────────────────────────────────────────

/**
 * Intro: Clio alone, with a soft pulsing ring — present, ready.
 */
function IntroStage() {
  return (
    <div className="relative w-32 h-32">
      <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" />
      <div className="absolute inset-2 rounded-full bg-white/10" />
      <div className="absolute inset-0 flex items-center justify-center">
        <Image
          src="/characters/clio.png"
          alt="Clio"
          fill
          className="object-contain drop-shadow-lg"
          priority
        />
      </div>
      <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-white/70 text-xs font-medium tracking-wide whitespace-nowrap">
        Clio · your guide
      </span>
    </div>
  );
}

/**
 * Appoint: Clio on the left "appoints" Sage on the right.
 *
 * The animation tells the story in three beats:
 *   1. Clio gestures (a glowing dot travels from Clio toward Sage)
 *   2. Sage scales in — she's been called into this room
 *   3. A small "appointed" badge appears between them
 */
function AppointStage() {
  return (
    <div className="relative w-full max-w-sm h-32 px-6">
      {/* Clio (left) */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2 w-20 h-20 animate-in fade-in slide-in-from-left duration-500">
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

      {/* Connector beam — a glowing dot travels Clio → Sage */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-0.5 bg-white/20 rounded-full overflow-hidden">
        <span className="absolute inset-y-0 left-0 w-3 h-full bg-white/80 rounded-full animate-appoint-beam" />
      </div>

      {/* Sage (right) — fades and scales in after a short delay */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 w-20 h-20 animate-appoint-sage-arrival">
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
        <span className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full bg-white/90 text-aggilo-sage text-[9px] font-bold animate-in fade-in zoom-in duration-300 delay-1000">
          ✓
        </span>
      </div>
    </div>
  );
}

/**
 * Collaborate: Clio and Sage in steady back-and-forth.
 *
 * Two character avatars sit side by side. Tiny chat bubbles surface
 * alternately above each one — Clio bubbles tinted amber, Sage bubbles
 * tinted sage-green. The cadence implies an ongoing dialogue.
 */
function CollaborateStage() {
  return (
    <div className="relative w-full max-w-sm h-32 px-6">
      {/* Clio bubble (above her, fires first) */}
      <div className="absolute left-6 top-0 w-20 flex justify-center">
        <span className="px-2 py-1 rounded-full bg-amber-200/95 text-amber-900 text-[9px] font-medium shadow-sm animate-collaborate-bubble-clio whitespace-nowrap">
          What's helping?
        </span>
      </div>

      {/* Clio (left) */}
      <div className="absolute left-6 bottom-2 w-20 h-20">
        <Image
          src="/characters/clio.png"
          alt="Clio"
          fill
          className="object-contain drop-shadow-lg"
          priority
        />
      </div>

      {/* Sage bubble (above her, fires second on offset) */}
      <div className="absolute right-6 top-0 w-20 flex justify-center">
        <span className="px-2 py-1 rounded-full bg-emerald-200/95 text-emerald-900 text-[9px] font-medium shadow-sm animate-collaborate-bubble-sage whitespace-nowrap">
          Three sisters asked.
        </span>
      </div>

      {/* Sage (right) */}
      <div className="absolute right-6 bottom-2 w-20 h-20">
        <Image
          src="/characters/sage.png"
          alt="Sage"
          fill
          className="object-contain drop-shadow-lg"
          priority
        />
      </div>

      {/* Connecting line between them */}
      <div className="absolute left-1/2 bottom-12 -translate-x-1/2 w-32 h-0.5 bg-white/30 rounded-full" />
    </div>
  );
}
