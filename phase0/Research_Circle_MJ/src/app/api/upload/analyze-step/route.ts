/**
 * POST /api/upload/analyze-step
 *
 * Thin HTTP wrapper around the shared analyze-step worker.
 * The core logic lives in src/lib/analyze-step-worker.ts so the
 * first step can be triggered directly from analysis-worker.ts
 * without a fragile server-to-server HTTP hop.
 */

import { NextResponse } from "next/server";
import { resolvePublicUrl } from "@/lib/path";
import { runAnalyzeStep } from "@/lib/analyze-step-worker";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { attachment_id?: string; step?: string };
    const triggerUrl = resolvePublicUrl(request, "/api/upload/analyze-step");
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
