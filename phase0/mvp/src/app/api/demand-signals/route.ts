/**
 * POST /api/demand-signals
 *
 * Anonymous endpoint. When a stranger lands on a public cluster page,
 * starts the join flow, and turns out to not fit the AGGIL filter (e.g.
 * a man arriving on Sisters in Dua), we offer to remember what they
 * were looking for and reach out when a fit emerges.
 *
 * No authentication required. Body fields are all optional except
 * `source_slug`. Email is optional — visitor can stay anonymous.
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

interface DemandSignalBody {
  source_slug?: string;
  source_cluster_id?: string;
  email?: string;
  visitor_country?: string;
  visitor_year_of_birth?: number;
  visitor_gender?: string;
  visitor_languages?: string[];
  visitor_interests?: string[];
  free_text_note?: string;
}

function emailLooksValid(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length <= 254;
}

export async function POST(request: Request) {
  let body: DemandSignalBody;
  try {
    body = (await request.json()) as DemandSignalBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.source_slug || typeof body.source_slug !== "string") {
    return NextResponse.json({ error: "source_slug required" }, { status: 400 });
  }
  if (body.email && !emailLooksValid(body.email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  // Anonymous client — RLS allows insert.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          /* no-op */
        },
      },
    }
  );

  const ua = request.headers.get("user-agent") ?? null;

  const { error } = await supabase.from("cluster_demand_signals").insert({
    source_slug: body.source_slug,
    source_cluster_id: body.source_cluster_id ?? null,
    email: body.email?.trim().toLowerCase() ?? null,
    visitor_country: body.visitor_country ?? null,
    visitor_year_of_birth: body.visitor_year_of_birth ?? null,
    visitor_gender: body.visitor_gender ?? null,
    visitor_languages: body.visitor_languages ?? null,
    visitor_interests: body.visitor_interests ?? null,
    free_text_note: body.free_text_note ?? null,
    user_agent: ua,
  });

  if (error) {
    console.warn("[demand-signals] insert failed:", error.message);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
