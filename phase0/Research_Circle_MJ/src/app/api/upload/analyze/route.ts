/**
 * POST /api/upload/analyze
 *
 * Thin HTTP wrapper around the shared analysis worker.
 * The upload route now calls runAnalysis() directly, but this
 * endpoint remains available for any external/manual triggers.
 */

import { NextResponse } from "next/server";
import { runAnalysis } from "@/lib/analysis-worker";

export async function POST(request: Request) {
  console.log("[analyze] invoked via HTTP");
  try {
    const { attachment_id } = (await request.json()) as { attachment_id?: string };
    if (!attachment_id) {
      return NextResponse.json({ error: "attachment_id required" }, { status: 400 });
    }
    const result = await runAnalysis(attachment_id);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[analyze] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
