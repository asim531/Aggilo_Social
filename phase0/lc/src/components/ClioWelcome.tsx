"use client";

/**
 * ClioWelcome — Long Conversation onboarding modal.
 *
 * Three-step modal that fires on a member's first session in the
 * cluster. The job is to orient — name what this room is, introduce
 * the agents, set expectations about the dynamics — without
 * performing welcome.
 *
 * Trigger:
 *   - Renders when profile.onboarded === false.
 *   - On dismiss (any step), the parent component (ClusterShell)
 *     stamps profile.onboarded = true.
 *
 * Pacing:
 *   - Skippable from any step (small "Skip" link in the corner).
 *   - The active dot indicator shows progress; the "Continue" button
 *     advances; the last step's CTA is "Enter the room."
 *
 * Voice:
 *   - LC's intimacy register, not the MVP's faith register.
 *   - Greets by nickname.
 *   - Names Sage as the room's anchor and Clio as personal guide.
 *   - Acknowledges the no-photo / no-DM mechanism without framing
 *     it as a limitation.
 *
 * Privacy: tagged data-clarity-mask="true" so Clarity recordings
 * don't capture the member's first impression.
 */

import { useState } from "react";

interface ClioWelcomeProps {
  nickname: string;
  onDismiss: () => void;
}

type StepKey = "intro" | "agents" | "dynamics";

interface Step {
  key: StepKey;
  title: string;
  body: React.ReactNode;
  /** A subtle hue per step, kept inside LC's palette. */
  accent: string;
}

export default function ClioWelcome({
  nickname,
  onDismiss,
}: ClioWelcomeProps) {
  const [step, setStep] = useState(0);

  const steps: Step[] = [
    {
      key: "intro",
      title: `Hey, ${nickname}.`,
      accent: "from-amber-50 to-stone-50 border-amber-200",
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
      accent: "from-teal-50 to-stone-50 border-teal-200",
      body: (
        <>
          <p className="mb-3">
            <span className="font-semibold text-lc-sage">Sage</span> is the
            room&apos;s anchor. She reads everything that&apos;s posted and
            speaks rarely — only when she has something genuine to add. She
            holds the register of the room, not its content. You&apos;ll see
            her in the Timeline.
          </p>
          <p className="mb-3">
            <span className="font-semibold text-lc-clio">Clio</span> is me.
            I&apos;m for you specifically — your guide, your private listener,
            the one who notices. Tap the button on the top-right whenever you
            want me. There&apos;s also a private mode in the same panel that
            stays just between us.
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
      accent: "from-stone-50 to-stone-50 border-stone-200",
      body: (
        <>
          <p className="mb-3">
            Every interaction here is a public Timeline post. There are no
            DMs yet, no follows, no likes. The conversation builds in the
            open — that&apos;s how something real becomes visible.
          </p>
          <p className="mb-3">
            Sage and I check in regularly about what this room could gain.
            You can read our working dialogue in the Workshop strip above the
            Timeline — it&apos;s collapsed by default; tap it when you&apos;re
            curious.
          </p>
          <p className="mb-3">
            Patience is the cluster&apos;s pace. People here are in no rush
            to get to a finish line. The right person for you to talk to is
            the one whose words you can&apos;t put down.
          </p>
          <p className="text-lc-muted text-sm">
            Take your time. The room is yours.
          </p>
        </>
      ),
    },
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-300"
      data-clarity-mask="true"
      role="dialog"
      aria-modal="true"
      aria-labelledby="clio-welcome-title"
    >
      <div className="bg-lc-card rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Accent header strip */}
        <div
          className={`bg-gradient-to-br ${current.accent} px-6 pt-6 pb-4 border-b`}
        >
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
            className="text-xl font-semibold text-lc-ink"
          >
            {current.title}
          </h2>
        </div>

        {/* Body */}
        <div className="px-6 py-5 text-sm text-lc-ink leading-relaxed">
          {current.body}
        </div>

        {/* Footer — progress + CTA */}
        <div className="px-6 pb-5 flex items-center justify-between border-t border-stone-100 pt-4">
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <span
                key={i}
                aria-hidden="true"
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === step ? "bg-lc-clio" : "bg-stone-200"
                }`}
              />
            ))}
            <span className="sr-only">
              Step {step + 1} of {steps.length}
            </span>
          </div>

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
