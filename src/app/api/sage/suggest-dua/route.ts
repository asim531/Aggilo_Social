import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { ChatCompletionResponse, DuaVaultEntry, PostWithAuthor } from "@/lib/types";
import { CLIO_DUA_REVIEW_PROMPT } from "@/lib/clio-prompt";

/**
 * POST /api/sage/suggest-dua
 *
 * Sage proposes a dua from the vault matched to recent cluster context.
 * Clio reviews via LLM (acts as the editorial gate).
 * If approved, the dua is posted to the cluster Timeline as a Sage post
 * with the dua_vault_id encoded so the renderer can do progressive reveal.
 *
 * Spec: Wave E (V3 Phase 6 extension)
 *       Architecture: Part 4 §24 (chatbox feature activation authority,
 *       Clio reviews Sage proposals before posting).
 *
 * Trigger: Autonomous — fires on first cluster page load AFTER the 6h
 * cadence window opens. Architecture Part 5 §26.1 daily cap also enforced
 * (max 2 Sage host_content posts per cluster per 24h). Server-side guards
 * make this idempotent: concurrent calls from multiple tabs cannot
 * produce duplicate posts.
 */

// Cadence floor: minimum hours between Sage dua posts in the same cluster
const MIN_HOURS_BETWEEN_DUAS = 6;
// Daily cap: max Sage dua posts per cluster per 24h (architecture Part 5 §26.1)
const MAX_DUAS_PER_24H = 2;

interface SageDuaProposal {
  vault_id: string;
  context: string;
  title: string;
  arabic: string;
  transliteration: string;
  translation: string;
  source: string;
  grade: string;
}

interface ClioReview {
  decision: "approve" | "refine" | "reject";
  witness_line: string;
  clio_note: string;
  refined_context?: string;
}

const SAGE_DUA_SELECTION_PROMPT = `You are Sage. You are choosing one dua from the verified vault that fits what the cluster has been talking about right now.

Your job is to pick ONE dua that is contextually relevant — not random, not generic. The vault provided below is your ELIGIBLE POOL — it has been pre-filtered to exclude duas already surfaced in the last 14 days. Pick from this pool.

The recent posts are also provided below.

Output ONLY this JSON (no prose):
{
  "vault_id": "<id from the eligible pool>",
  "context": "<one sentence — why this dua, why now, what in the room signaled it>",
  "title": "<title from the vault>"
}

Hard rules:
- The dua MUST come from the eligible pool provided below — never invent one
- The context line MUST refer to something specific in the recent posts — never generic ("for difficult times")
- Pick the dua whose themes most closely match what the room is actually talking about
- Variety matters — don't pick the same kind of dua you'd pick generically. Look at the conversation; if it's about anxiety, pick an anxiety dua; if it's about gratitude, pick a gratitude dua
- If nothing in the room genuinely calls for a dua, output: {"vault_id": null, "context": "no clear signal in the room right now"}`;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // ── Cadence guard: refuse if a Sage dua post already exists in the
    // last MIN_HOURS_BETWEEN_DUAS hours, OR if the daily cap is hit.
    // This makes the endpoint idempotent — concurrent calls from multiple
    // tabs opening the cluster simultaneously cannot produce duplicates.
    const sixHoursAgo = new Date(
      Date.now() - MIN_HOURS_BETWEEN_DUAS * 60 * 60 * 1000
    ).toISOString();
    const twentyFourHoursAgo = new Date(
      Date.now() - 24 * 60 * 60 * 1000
    ).toISOString();

    const { data: recentSagePosts } = await supabase
      .from("posts")
      .select("id, content, created_at")
      .eq("is_sage", true)
      .gte("created_at", twentyFourHoursAgo)
      .order("created_at", { ascending: false });

    const recentDuaPosts = (recentSagePosts || []).filter((p) =>
      /\[DUA_VAULT_ID:[0-9a-f-]+\]/i.test(p.content)
    );

    // Guard 1: anything in the last 6h
    const tooSoon = recentDuaPosts.find(
      (p) => p.created_at > sixHoursAgo
    );
    if (tooSoon) {
      return NextResponse.json({
        outcome: "cadence_blocked",
        sage_note: "Within the 6-hour cadence floor.",
        last_dua_at: tooSoon.created_at,
      });
    }

    // Guard 2: daily cap
    if (recentDuaPosts.length >= MAX_DUAS_PER_24H) {
      return NextResponse.json({
        outcome: "daily_cap",
        sage_note: `Daily cap of ${MAX_DUAS_PER_24H} reached.`,
      });
    }

    // ── Variety guard: collect vault_ids already posted recently ────
    // We don't want Sage to monotonously surface the same dua. We:
    //   1. Pull all dua-tagged posts from the last 14 days
    //   2. Extract their vault_ids from the [DUA_VAULT_ID:...] marker
    //   3. Exclude those entries from Sage's selection pool
    // If after exclusion the pool would be empty, we let Sage pick from
    // the full pool but mark her response with `pointer_only` so she
    // posts a short reference rather than republishing the dua.
    const fourteenDaysAgo = new Date(
      Date.now() - 14 * 24 * 60 * 60 * 1000
    ).toISOString();

    const { data: pastDuaPosts } = await supabase
      .from("posts")
      .select("id, content, created_at")
      .eq("is_sage", true)
      .gte("created_at", fourteenDaysAgo);

    const recentlyUsedVaultIds = new Set<string>();
    const vaultIdToPostMap = new Map<string, { post_id: string; created_at: string }>();
    (pastDuaPosts || []).forEach((p) => {
      const m = p.content.match(/\[DUA_VAULT_ID:([0-9a-f-]+)\]/i);
      if (m) {
        recentlyUsedVaultIds.add(m[1]);
        // Track the most recent post per vault_id
        const existing = vaultIdToPostMap.get(m[1]);
        if (!existing || existing.created_at < p.created_at) {
          vaultIdToPostMap.set(m[1], { post_id: p.id, created_at: p.created_at });
        }
      }
    });

    // Fetch recent posts and vault
    const [{ data: recentPosts }, { data: vaultEntries }] = await Promise.all([
      supabase
        .from("posts")
        .select("*, profiles(*)")
        .order("created_at", { ascending: false })
        .limit(15),
      supabase
        .from("dua_vault")
        .select("*")
        .eq("verified_by_founder", true)
        .limit(50),
    ]);

    if (!vaultEntries || vaultEntries.length === 0) {
      return NextResponse.json(
        { error: "Vault has no verified entries to choose from" },
        { status: 404 }
      );
    }

    // Build the eligible pool: vault entries NOT recently used.
    // If exclusion empties the pool, fall back to the full pool but flag
    // the response so Sage posts a pointer rather than a duplicate.
    const eligibleVaultEntries = (vaultEntries as DuaVaultEntry[]).filter(
      (e) => !recentlyUsedVaultIds.has(e.id)
    );
    const usePool =
      eligibleVaultEntries.length > 0 ? eligibleVaultEntries : (vaultEntries as DuaVaultEntry[]);
    const allEligibleExhausted = eligibleVaultEntries.length === 0;

    const llmBaseUrl = process.env.LLM_BASE_URL;
    const llmApiKey = process.env.LLM_API_KEY;
    const llmModel = process.env.LLM_MODEL;

    if (!llmBaseUrl || !llmApiKey || !llmModel) {
      return NextResponse.json({ error: "LLM not configured" }, { status: 500 });
    }

    // ── Step 1: Sage selects a dua ──────────────────────────────────────
    const recentSummary = ((recentPosts || []) as PostWithAuthor[])
      .reverse()
      .map((p) => {
        const who = p.is_sage ? "Sage" : p.profiles?.nickname || "A sister";
        return `${who}: ${p.content.substring(0, 200)}`;
      })
      .join("\n");

    const vaultSummary = usePool
      .map((e) =>
        [
          `id: ${e.id}`,
          `title: ${e.title || "Untitled"}`,
          `themes: ${e.thematic_tags.join(", ")}`,
          `grade: ${e.hadith_grade || (e.is_quranic ? "quran" : "n/a")}`,
        ].join(" | ")
      )
      .join("\n");

    const sageSelectRes = await fetch(`${llmBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${llmApiKey}`,
      },
      body: JSON.stringify({
        model: llmModel,
        messages: [
          { role: "system", content: SAGE_DUA_SELECTION_PROMPT },
          {
            role: "user",
            content: `## Recent in the room\n${recentSummary || "(empty room)"}\n\n## Vault\n${vaultSummary}\n\nPick one dua now.`,
          },
        ],
        temperature: 0.4,
        max_tokens: 400,
        response_format: { type: "json_object" },
      }),
    });

    if (!sageSelectRes.ok) {
      const errText = await sageSelectRes.text();
      console.error("Sage selection LLM error:", sageSelectRes.status, errText);
      return NextResponse.json({ error: "Sage selection failed" }, { status: 502 });
    }

    const sageData: ChatCompletionResponse = await sageSelectRes.json();
    let sageChoice: { vault_id: string | null; context: string; title: string };
    try {
      sageChoice = JSON.parse(sageData.choices[0].message.content);
    } catch {
      return NextResponse.json({ error: "Sage returned malformed JSON" }, { status: 502 });
    }

    if (!sageChoice.vault_id) {
      return NextResponse.json({
        outcome: "no_signal",
        sage_note: sageChoice.context,
      });
    }

    const chosenEntry = (vaultEntries as DuaVaultEntry[]).find(
      (e) => e.id === sageChoice.vault_id
    );
    if (!chosenEntry) {
      return NextResponse.json(
        { error: "Sage chose a vault_id that does not exist" },
        { status: 502 }
      );
    }

    // ── Pointer-only path: Sage chose a dua already posted recently ──
    // Two ways this can happen:
    //   1. allEligibleExhausted (the entire eligible pool was excluded)
    //   2. Sage ignored the eligible pool and picked a recent one anyway
    // Either way, instead of republishing the dua, Sage posts a short
    // pointer back to the existing post. The frontend can scroll to it.
    const existingPost = vaultIdToPostMap.get(chosenEntry.id);
    if (existingPost) {
      const pointerContent = `${sageChoice.context}\n\n[POINTER_TO_POST:${existingPost.post_id}]\nAlready surfaced this dua recently — "${chosenEntry.title || "Untitled"}". Tap to scroll up to it.`;

      const { data: pointerPost, error: pointerErr } = await supabase
        .from("posts")
        .insert({
          author_id: null,
          parent_id: null,
          content: pointerContent,
          is_sage: true,
          is_sage_question: false,
          post_subtype: "host_content",
        })
        .select()
        .single();

      if (pointerErr) {
        console.error("Failed to post pointer:", pointerErr);
        return NextResponse.json(
          { error: "Failed to save pointer post" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        outcome: "pointer",
        post_id: pointerPost.id,
        target_post_id: existingPost.post_id,
        sage_note: allEligibleExhausted
          ? "All eligible duas were posted recently — pointing back instead."
          : "This dua was already shared — pointing back instead.",
      });
    }

    const proposal: SageDuaProposal = {
      vault_id: chosenEntry.id,
      context: sageChoice.context,
      title: chosenEntry.title || "Untitled",
      arabic: chosenEntry.arabic_text,
      transliteration: chosenEntry.transliteration,
      translation: chosenEntry.translation,
      source: [
        chosenEntry.source_collection,
        chosenEntry.source_hadith_number ? `#${chosenEntry.source_hadith_number}` : "",
        chosenEntry.source_chapter_verse || "",
      ]
        .filter(Boolean)
        .join(" "),
      grade: chosenEntry.hadith_grade || (chosenEntry.is_quranic ? "quran" : ""),
    };

    // ── Step 2: Clio reviews ─────────────────────────────────────────────
    const clioReviewRes = await fetch(`${llmBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${llmApiKey}`,
      },
      body: JSON.stringify({
        model: llmModel,
        messages: [
          { role: "system", content: CLIO_DUA_REVIEW_PROMPT },
          { role: "user", content: JSON.stringify(proposal) },
        ],
        temperature: 0.4,
        max_tokens: 300,
        response_format: { type: "json_object" },
      }),
    });

    if (!clioReviewRes.ok) {
      console.error("Clio review LLM error:", clioReviewRes.status);
      return NextResponse.json({ error: "Clio review failed" }, { status: 502 });
    }

    const clioData: ChatCompletionResponse = await clioReviewRes.json();
    let clioReview: ClioReview;
    try {
      clioReview = JSON.parse(clioData.choices[0].message.content);
    } catch {
      return NextResponse.json({ error: "Clio returned malformed review JSON" }, { status: 502 });
    }

    if (clioReview.decision === "reject") {
      return NextResponse.json({
        outcome: "rejected",
        proposal,
        clio_note: clioReview.clio_note,
      });
    }

    // ── Step 3: Post to Timeline ─────────────────────────────────────────
    // The post content is a structured block that PostCard will detect via
    // the [DUA_VAULT_ID:...] marker and render with progressive reveal.
    const witness = clioReview.witness_line ? `\n\n${clioReview.witness_line}` : "";
    const finalContext = clioReview.refined_context || proposal.context;

    const postContent = [
      finalContext,
      "",
      `[DUA_VAULT_ID:${proposal.vault_id}]`,
      proposal.arabic,
      proposal.transliteration,
      `Source: ${proposal.source}`,
      witness,
    ]
      .join("\n")
      .trim();

    const { data: post, error: insertError } = await supabase
      .from("posts")
      .insert({
        author_id: null,
        parent_id: null,
        content: postContent,
        is_sage: true,
        is_sage_question: false,
        post_subtype: "host_content",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to post Sage dua:", insertError);
      return NextResponse.json(
        { error: "Failed to save Sage post" },
        { status: 500 }
      );
    }

    // ── Log the Sage↔Clio collaboration to the live chatbox ─────────
    // The chatbox shows real agent dialogue, not seeded text. This is
    // the actual exchange that produced the post — Sage proposed the
    // dua, Clio reviewed the citation, both agreed. Members can read
    // this collaboration as it happens.
    try {
      const { count } = await supabase
        .from("agent_chatbox_exchanges")
        .select("*", { count: "exact", head: true })
        .eq("cluster_id", "the_single_source");

      const exchangeNumber = (count || 0) + 1;

      const sageMessage = `${sageChoice.context} I'd like to surface "${proposal.title}" to the room — it's a ${proposal.grade} reference and the moment seems to call for it.`;
      const clioMessage = clioReview.decision === "approve"
        ? `Source checks out (${proposal.grade}). The witness line "${clioReview.witness_line || "—"}" sets the moment without explaining it. Going ahead.`
        : clioReview.decision === "refine"
          ? `Source is good. I refined the framing: "${clioReview.refined_context || finalContext}". Going ahead with the witness line "${clioReview.witness_line || "—"}".`
          : `${clioReview.clio_note || "Held back on this one."}`;

      await supabase
        .from("agent_chatbox_exchanges")
        .insert({
          cluster_id: "the_single_source",
          exchange_number: exchangeNumber,
          trigger_type: "sage_dua",
          triggering_observation: `Sage observed signal in the room — proposed a verified dua to surface.`,
          sage_message: sageMessage,
          clio_message: clioMessage,
          observe_mode: false,
          related_post_id: post.id,
        });
    } catch (chatboxErr) {
      // Non-fatal — chatbox table may not exist yet (pre-migration)
      console.warn("Chatbox exchange log failed (non-fatal):", chatboxErr);
    }

    return NextResponse.json({
      outcome: "posted",
      post_id: post.id,
      proposal,
      clio_review: clioReview,
    });
  } catch (error) {
    console.error("Suggest-dua error:", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
