import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { fetchLinkMeta } from "@/lib/link-preview";

/**
 * POST /api/links/unfurl
 *
 * Fetches metadata for a URL. Results are cached in `link_previews` for 7 days.
 * 
 * In Long Conversation, Sage does not evaluate links for "on-topic/off-topic" 
 * alignment because the room has no predefined topics. It purely unfurls the link.
 */
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

    // Upsert into cache
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const row = {
      url,
      title: meta?.title || null,
      description: meta?.description || null,
      image_url: meta?.thumbnail || null,
      site_name: meta?.site_name || parsed.hostname.replace(/^www\./, ""),
      sage_verdict: null,
      sage_reason: null,
      evaluated_at: null,
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
