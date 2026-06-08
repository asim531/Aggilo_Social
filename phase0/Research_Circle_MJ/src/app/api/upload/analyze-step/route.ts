/**
 * POST /api/upload/analyze-step
 *
 * Triggers the NEXT step BEFORE running the current step's heavy work.
 * This ensures the chain survives even if the current step exceeds
 * Vercel's 10s serverless timeout.
 */

import { NextResponse } from "next/server";
import { resolvePublicUrl } from "@/lib/path";
import { runAnalyzeStep, STEPS } from "@/lib/analyze-step-worker";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { attachment_id?: string; step?: string };
    const triggerUrl = resolvePublicUrl(request, "/api/upload/analyze-step");
    const currentStep = body.step ?? STEPS[0];

    // Trigger the NEXT step BEFORE doing heavy work.
    // If this step times out, the next one is already running.
    const currentIdx = STEPS.indexOf(currentStep);
    const nextStep = currentIdx >= 0 && currentIdx < STEPS.length - 1 ? STEPS[currentIdx + 1] : null;
    if (nextStep) {
      console.log("[analyze-step] pre-triggering next step:", nextStep);
      void fetch(triggerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attachment_id: body.attachment_id, step: nextStep }),
      }).catch((err) => {
        console.error("[analyze-step] pre-trigger failed:", err);
      });
    }

    const result = await runAnalyzeStep({
      attachment_id: body.attachment_id!,
      step: body.step,
      triggerUrl,
    });

    if (result.outcome === "error") {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === "attachment not found" ? 404 : 400 }
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    console.warn("[analyze-step] error:", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
