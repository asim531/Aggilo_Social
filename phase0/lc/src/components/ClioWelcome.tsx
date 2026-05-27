"use client";

/**
 * ClioWelcome — Long Conversation orientation modal.
 *
 * User-invoked from the HelpMenu (top-right of the navbar). Three
 * tight steps with character images and gentle micro-animations.
 * Tone: short, specific, non-precious. The room is the experience —
 * this modal is just orientation, not a ceremony.
 */

import { useState } from "react";
import Image from "next/image";
import { withBasePath } from "@/lib/path";

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
          <p className="mb-2">
            This is <strong>Long Conversation</strong>. Text-only, nicknames only. No photos, no likes.
          </p>
          <p className="text-lc-muted text-sm">
            The room sets the vibe. When there's a spark, I can open a private channel for DMs.
          </p>
        </>
      ),
    },
    {
      key: "agents",
      title: "Two of us in here.",
      accentFrom: "from-teal-600",
      accentTo: "to-teal-700",
      borderColor: "border-teal-200",
      body: (
        <>
          <p className="mb-2">
            <span className="font-semibold text-lc-sage">Sage</span> anchors the room. She speaks rarely, only when she has something to add.
          </p>
          <p className="mb-2">
            <span className="font-semibold text-lc-clio">Clio</span> — me — is for you. Tap the button top-right when you want me. Private mode lives in the same panel.
          </p>
        </>
      ),
    },
    {
      key: "dynamics",
      title: "How it works.",
      accentFrom: "from-stone-600",
      accentTo: "to-stone-700",
      borderColor: "border-stone-200",
      body: (
        <>
          <p className="mb-2">
            Every post is public. The conversation builds in the open.
          </p>
          <p className="text-lc-muted text-sm">
            The Workshop strip below the Timeline shows what Sage and I are working on for the room. Tap it when you&apos;re curious.
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
      <div className="bg-lc-card rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
        {/* Animated stage */}
        <div
          className={`bg-gradient-to-br ${current.accentFrom} ${current.accentTo} relative flex items-center justify-center py-6 overflow-hidden min-h-[150px]`}
        >
          {current.key === "intro" && <IntroStage />}
          {current.key === "agents" && <AgentsStage />}
          {current.key === "dynamics" && <DynamicsStage />}
        </div>

        {/* Header */}
        <div className={`px-5 pt-3 pb-0 border-b ${current.borderColor}`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase tracking-[0.18em] text-lc-muted font-medium">
              Long Conversation
            </span>
            <button
              type="button"
              onClick={onDismiss}
              className="text-xs text-lc-muted hover:text-lc-ink transition-colors px-1"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <h2
            id="clio-welcome-title"
            className="text-lg font-semibold text-lc-ink pb-3"
          >
            {current.title}
          </h2>
        </div>

        {/* Body */}
        <div className="px-5 py-4 text-sm text-lc-ink leading-relaxed">
          {current.body}
        </div>

        {/* Footer */}
        <div className="px-5 pb-4 flex items-center justify-between border-t border-stone-100 pt-3">
          <div className="flex gap-1.5" aria-hidden="true">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step ? "w-3 bg-lc-clio" : "w-1.5 bg-stone-200"
                }`}
              />
            ))}
          </div>
          <span className="sr-only">
            Step {step + 1} of {steps.length}
          </span>

          <div className="flex items-center gap-1.5">
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
              className="px-4 py-1.5 bg-lc-clio text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors"
            >
              {isLast ? "Got it" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Animated stages ────────────────────────────────────────────────

function IntroStage() {
  return (
    <div className="relative w-24 h-24">
      <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" />
      <div className="absolute inset-2 rounded-full bg-white/10" />
      <div className="absolute inset-0 flex items-center justify-center">
        <img
          src={withBasePath("/characters/clio.png")}
          alt="Clio"
          className="object-contain drop-shadow-lg w-full h-full"
        />
      </div>
    </div>
  );
}

function AgentsStage() {
  return (
    <div className="relative w-full max-w-xs h-24 px-4">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-16 h-16">
        <img
          src={withBasePath("/characters/clio.png")}
          alt="Clio"
          className="object-contain drop-shadow-lg w-full h-full"
        />
        <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-[9px] font-medium whitespace-nowrap">
          Clio
        </span>
      </div>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-0.5 bg-white/20 rounded-full overflow-hidden">
        <span
          className="absolute inset-y-0 left-0 w-3 h-full bg-white/90 rounded-full"
          style={{ animation: "beam 1.4s ease-in-out infinite" }}
        />
      </div>
      <div
        className="absolute right-4 top-1/2 -translate-y-1/2 w-16 h-16"
        style={{ animation: "sage-arrive 0.6s ease-out 0.4s both" }}
      >
        <img
          src={withBasePath("/characters/sage.png")}
          alt="Sage"
          className="object-contain drop-shadow-lg w-full h-full"
        />
        <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-[9px] font-medium whitespace-nowrap">
          Sage
        </span>
      </div>
      <style jsx>{`
        @keyframes beam {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(700%); }
        }
        @keyframes sage-arrive {
          from { opacity: 0; transform: translateY(-50%) scale(0.8); }
          to { opacity: 1; transform: translateY(-50%) scale(1); }
        }
      `}</style>
    </div>
  );
}

function DynamicsStage() {
  return (
    <div className="relative w-full max-w-xs h-24 px-4">
      <div
        className="absolute left-4 top-0 w-20 flex justify-center"
        style={{ animation: "bubble-in 0.4s ease-out 0.1s both" }}
      >
        <span className="px-2 py-0.5 rounded-full bg-amber-200/95 text-amber-900 text-[9px] font-medium shadow-sm whitespace-nowrap">
          What&apos;s missing?
        </span>
      </div>
      <div className="absolute left-4 bottom-0 w-16 h-16">
        <img
          src={withBasePath("/characters/clio.png")}
          alt="Clio"
          className="object-contain drop-shadow-lg w-full h-full"
        />
      </div>
      <div
        className="absolute right-4 top-0 w-20 flex justify-center"
        style={{ animation: "bubble-in 0.4s ease-out 0.7s both" }}
      >
        <span className="px-2 py-0.5 rounded-full bg-teal-200/95 text-teal-900 text-[9px] font-medium shadow-sm whitespace-nowrap">
          A way to go deeper.
        </span>
      </div>
      <div className="absolute right-4 bottom-0 w-16 h-16">
        <img
          src={withBasePath("/characters/sage.png")}
          alt="Sage"
          className="object-contain drop-shadow-lg w-full h-full"
        />
      </div>
      <div className="absolute left-1/2 bottom-8 -translate-x-1/2 w-16 h-0.5 bg-white/30 rounded-full" />
      <style jsx>{`
        @keyframes bubble-in {
          from { opacity: 0; transform: translateY(6px) scale(0.9); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
