import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { fetchLinkMeta, extractFirstUrl } from "@/lib/link-preview";
import { ChatCompletionResponse } from "@/lib/types";

/**
 * POST /api/links/unfurl
 *
 * Fetches metadata for a URL and runs Sage's alignment evaluation.
 * Results are cached in `link_previews` for 7 days.
 *
 * Called by LinkPreviewCard when a post contains a URL.
 * Fire-and-forget from the client — the card polls for the result.
 */

const ALIGNMENT_PROMPT = `You are Sage, the cluster Anchor for "Sisters in Dua" — a women-only community for Muslim women navigating faith in real life. Grounded in Quran and authentic Sunnah.

A member has shared a link. Evaluate whether this content is broadly aligned with the cluster's purpose.

Aligned ("on_topic"): faith, Islamic practice, Quran, hadith, Muslim women's lived experience, spirituality, or topics that genuinely serve a Muslim woman navigating faith in real life.

Not aligned ("off_topic"): clearly off-topic content — entertainment, unrelated politics, commercial content, etc.

When in doubt, output "unsure" — you are not a gatekeeper.

Output ONLY this JSON:
{
  "verdict": "on_topic" | "off_topic" | "unsure",
  "reason": "<one short phrase, e.g. 'Islamic lecture on salah' or 'unrelated entertainment content'>"
}`;

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Missing url" }, { status: 400 });
    }

    // Validate URL
    let parsed: URL;
    try {
      parsed = new URL(url);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    const supabase = await createClient();

    // Check cache first
    const { data: cached } = await supabase
      .from("link_previews")
      .select("*")
      .eq("url", url)
      .maybeSingle();

    if (cached && cached.expires_at && new Date(cached.expires_at) > new Date()) {
      return NextResponse.json({ preview: cached });
    }

    // Fetch metadata
    const meta = await fetchLinkMeta(url);

    // Run Sage alignment
    const llmBaseUrl = process.env.LLM_BASE_URL;
    const llmApiKey = process.env.LLM_API_KEY;
    const llmModel = process.env.LLM_MODEL;

    let verdict: "on_topic" | "off_topic" | "unsure" | null = null;
    let reason: string | null = null;

    if (llmBaseUrl && llmApiKey && llmModel && meta) {
      const contentSummary = [
        meta.title ? `Title: ${meta.title}` : null,
        meta.description ? `Description: ${meta.description.substring(0, 300)}` : null,
        meta.site_name ? `Site: ${meta.site_name}` : null,
        `URL: ${url}`,
      ]
        .filter(Boolean)
        .join("\n");

      try {
        const res = await fetch(`${llmBaseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${llmApiKey}`,
          },
          body: JSON.stringify({
            model: llmModel,
            messages: [
              { role: "system", content: ALIGNMENT_PROMPT },
              { role: "user", content: contentSummary },
            ],
            temperature: 0.2,
            max_tokens: 80,
            response_format: { type: "json_object" },
          }),
          signal: AbortSignal.timeout(12000),
        });

        if (res.ok) {
          const data: ChatCompletionResponse = await res.json();
          const parsed_result: { verdict: string; reason?: string } = JSON.parse(
            data.choices[0].message.content
          );
          verdict = (["on_topic", "off_topic", "unsure"].includes(parsed_result.verdict)
            ? (parsed_result.verdict as "on_topic" | "off_topic" | "unsure")
            : "unsure");
          reason = parsed_result.reason || null;
        }
      } catch {
        // LLM failed — no verdict
      }
    }

    // Upsert into cache
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const row = {
      url,
      title: meta?.title || null,
      description: meta?.description || null,
      image_url: meta?.thumbnail || null,
      site_name: meta?.site_name || parsed.hostname.replace(/^www\./, ""),
      sage_verdict: verdict,
      sage_reason: reason,
      evaluated_at: verdict ? new Date().toISOString() : null,
      fetch_status: meta ? 200 : 0,
      fetch_error: meta ? null : "fetch_failed",
      expires_at: expiresAt,
    };

    const { data: upserted } = await supabase
      .from("link_previews")
      .upsert(row, { onConflict: "url" })
      .select()
      .single();

    return NextResponse.json({ preview: upserted || row });
  } catch (err) {
    console.error("Unfurl error:", err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
