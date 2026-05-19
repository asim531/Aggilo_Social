import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { buildSageMessages } from "@/lib/sage-prompt";
import { detectWelfareSignal } from "@/lib/clio-prompt";
import {
  selectGreetingTemplate,
  type HandoffReason,
} from "@/lib/handoff-greetings";
import { fetchLinkMeta, extractFirstUrl } from "@/lib/link-preview";
import { PostWithAuthor, DuaVaultEntry, ChatCompletionResponse } from "@/lib/types";

/**
 * POST /api/sage/evaluate
 *
 * Called AFTER a post is saved to Supabase — never blocks the user's post submission.
 * Evaluates the post through Sage's decision framework and optionally posts a response.
 *
 * Priority 2 (V3 Phase 6): Sage evaluation is fully separated from post submission.
 * The user's post appears immediately (optimistic). This route fires in the background.
 *
 * Senior UX additions:
 *  - @Sage mention forces a response (overrides default silence)
 *  - Welfare regex pre-filter runs BEFORE the LLM (belt-and-braces — symmetry with Clio)
 *  - When Sage decides silence is right but the post warrants private follow-up,
 *    a soft Clio handoff is queued (member chooses whether to engage)
 */
export async function POST(request: Request) {
  try {
    const { post_id } = await request.json();

    if (!post_id) {
      return NextResponse.json({ evaluated: false, error: "Missing post_id" }, { status: 400 });
    }

    const supabase = await createClient();

    // Fetch the triggering post
    const { data: triggeringPost, error: fetchError } = await supabase
      .from("posts")
      .select("*, profiles(*)")
      .eq("id", post_id)
      .single();

    if (fetchError || !triggeringPost) {
      return NextResponse.json({ evaluated: false, error: "Post not found" }, { status: 404 });
    }

    // Skip evaluation if this is already a Sage post
    if (triggeringPost.is_sage) {
      return NextResponse.json({ evaluated: true, skipped: "sage_post" });
    }

    // ── Belt-and-braces signal detection (symmetry with Clio chat) ──────
    const mentionsSage = /@sage\b/i.test(triggeringPost.content);
    const isWelfare = detectWelfareSignal(triggeringPost.content);

    // If the platform detects a welfare signal, log it BEFORE the LLM call
    // so the founder/manager queue captures it even if the LLM misses cues.
    if (isWelfare) {
      await supabase
        .from("welfare_notifications")
        .insert({
          post_id: triggeringPost.id,
          user_id: triggeringPost.author_id,
          trigger_content: `[POST] ${triggeringPost.content.substring(0, 500)}`,
          sage_response: null,
          resolved: false,
        })
        .select()
        .single()
        
        ;

      // Mark the post thread state for the welfare card
      await supabase
        .from("posts")
        .update({ thread_state: "welfare_flagged" })
        .eq("id", triggeringPost.id)
        
        ;
    }

    // ── Link detection + metadata fetch ─────────────────────────────
    // If the post contains a URL, fetch its metadata server-side and
    // store it on the post. Then run a second LLM pass to evaluate
    // whether the content aligns with the cluster's purpose.
    // Both operations are fire-and-forget relative to the main Sage
    // evaluation — they run in parallel and update the post via UPDATE.
    const linkUrl = extractFirstUrl(triggeringPost.content);
    if (linkUrl) {
      // Mark as "evaluating" immediately so the UI can show a spinner
      await supabase
        .from("posts")
        .update({ link_url: linkUrl, link_alignment: "evaluating" })
        .eq("id", triggeringPost.id)
        
        ;

      // Fetch metadata + run alignment in parallel (non-blocking)
      evaluateLinkAlignment(
        supabase,
        triggeringPost.id,
        linkUrl,
        process.env.LLM_BASE_URL,
        process.env.LLM_API_KEY,
        process.env.LLM_MODEL
      );
    }

    // Fetch recent posts for conversational context (last 20)
    const { data: recentPosts } = await supabase
      .from("posts")
      .select("*, profiles(*)")
      .order("created_at", { ascending: true })
      .limit(20);

    // Fetch verified vault entries for reference grounding
    const { data: vaultEntries } = await supabase
      .from("dua_vault")
      .select("*")
      .eq("verified_by_founder", true)
      .limit(10);

    const messages = buildSageMessages(
      triggeringPost.content,
      (recentPosts as PostWithAuthor[]) || [],
      (vaultEntries as DuaVaultEntry[]) || [],
      { mentionsSage, isWelfare }
    );

    const llmBaseUrl = process.env.LLM_BASE_URL;
    const llmApiKey = process.env.LLM_API_KEY;
    const llmModel = process.env.LLM_MODEL;

    if (!llmBaseUrl || !llmApiKey || !llmModel) {
      // LLM not configured — evaluation skipped silently
      return NextResponse.json({ evaluated: false, skipped: "llm_not_configured" });
    }

    const llmResponse = await fetch(`${llmBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${llmApiKey}`,
      },
      body: JSON.stringify({
        model: llmModel,
        messages,
        temperature: 0.5,
        max_tokens: 800,
      }),
    });

    if (!llmResponse.ok) {
      console.error("Sage evaluate: LLM error", llmResponse.status);
      return NextResponse.json({ evaluated: false, error: "LLM unavailable" }, { status: 502 });
    }

    const llmData: ChatCompletionResponse = await llmResponse.json();
    const sageContent = llmData.choices?.[0]?.message?.content?.trim();

    // Sage chose silence — correct and expected
    if (!sageContent || sageContent === "[SAGE_SILENT]") {
      // Soft Clio handoff: when silence is right but a private follow-up
      // would serve the member, queue a Clio greeting in their private tab.
      // Triggers (narrow set for MVP):
      //   - Welfare signal detected
      //   - Sage was @-mentioned but chose silence (rare — usually forced response)
      // The member chooses whether to engage. Cluster sees a small inline note
      // under their post. This is a soft handoff — not a hard escalation.
      const shouldHandoff = isWelfare && triggeringPost.author_id;

      if (shouldHandoff) {
        const reason: HandoffReason = "welfare";
        const template = selectGreetingTemplate(reason, triggeringPost.id);

        await supabase
          .from("posts")
          .update({
            sage_handoff_to_clio_at: new Date().toISOString(),
            sage_handoff_reason: reason,
          })
          .eq("id", triggeringPost.id)
          
          ;

        await supabase
          .from("clio_handoff_greetings")
          .insert({
            triggering_post_id: triggeringPost.id,
            user_id: triggeringPost.author_id,
            handoff_reason: reason,
            greeting_text: template.text,
          })
          
          ;

        // Log the silent collaboration to the live agent chatbox.
        // The cluster sees an exchange acknowledging that Sage stepped
        // back deliberately and Clio is following up privately. The
        // member's content is never quoted.
        try {
          const { count } = await supabase
            .from("agent_chatbox_exchanges")
            .select("*", { count: "exact", head: true })
            .eq("cluster_id", "the_single_source");

          await supabase.from("agent_chatbox_exchanges").insert({
            cluster_id: "the_single_source",
            exchange_number: (count || 0) + 1,
            trigger_type: "sage_initiated",
            triggering_observation:
              "A post landed that called for private witnessing rather than a public reply.",
            sage_message:
              "I'm staying out of this one publicly. Some moments belong in private. Clio — would you reach out?",
            clio_message:
              "Already on it. Sending a private greeting now. The room will see only that we're following up.",
            observe_mode: false,
            related_post_id: triggeringPost.id,
          });
        } catch {
          // Non-fatal
        }
      }

      return NextResponse.json({
        evaluated: true,
        responded: false,
        handoff: shouldHandoff,
      });
    }

    // Save Sage's response as a reply to the triggering post
    const { data: sagePost, error: insertError } = await supabase
      .from("posts")
      .insert({
        author_id: null,
        parent_id: post_id,
        content: sageContent,
        is_sage: true,
        is_sage_question: false,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Sage evaluate: failed to save response", insertError);
      return NextResponse.json({ evaluated: false, error: "Failed to save Sage response" }, { status: 500 });
    }

    return NextResponse.json({ evaluated: true, responded: true, reply_id: sagePost.id });
  } catch (error) {
    console.error("Sage evaluate: unexpected error", error);
    return NextResponse.json({ evaluated: false, error: "Unexpected error" }, { status: 500 });
  }
}

// ── Link alignment helper ────────────────────────────────────────────────
//
// Runs asynchronously after the main Sage evaluation. Fetches link metadata,
// stores it on the post, then asks the LLM whether the content aligns with
// the cluster's purpose. Updates posts.link_alignment and posts.link_meta.
//
// Alignment result:
//   "aligned"    → a small ✓ badge appears on the link card in the UI
//   "misaligned" → no badge, no public comment from Sage (no shaming)
//   null         → fetch failed or LLM unavailable
//
// The cluster purpose is injected from the Sage system prompt so the
// evaluation is cluster-aware, not generic.

const LINK_ALIGNMENT_PROMPT = `You are Sage, the cluster Anchor for "Sisters in Dua" — a women-only community for Muslim women navigating faith in real life. Grounded in Quran and authentic Sunnah.

A member has shared a link. You have been given the link's title and description. Evaluate whether this content is broadly aligned with the cluster's purpose.

Aligned means: the content is about faith, Islamic practice, Quran, hadith, Muslim women's lived experience, spirituality, or topics that would genuinely serve a Muslim woman navigating faith in real life.

Misaligned means: the content is clearly off-topic (entertainment, politics, unrelated news, commercial content, etc.).

When in doubt, lean toward "aligned" — you are not a gatekeeper, just a signal.

Output ONLY this JSON:
{
  "alignment": "aligned" | "misaligned",
  "reason": "<one short phrase, e.g. 'Islamic lecture on salah' or 'unrelated entertainment content'>"
}`;

async function evaluateLinkAlignment(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  postId: string,
  url: string,
  llmBaseUrl: string | undefined,
  llmApiKey: string | undefined,
  llmModel: string | undefined
): Promise<void> {
  // Step 1: fetch metadata
  const meta = await fetchLinkMeta(url);

  // Store metadata regardless of LLM availability
  if (meta) {
    await supabase
      .from("posts")
      .update({ link_meta: meta })
      .eq("id", postId)
      
      ;
  }

  // Step 2: LLM alignment check
  if (!llmBaseUrl || !llmApiKey || !llmModel) {
    // No LLM — mark as null (no badge, no error)
    await supabase
      .from("posts")
      .update({ link_alignment: null })
      .eq("id", postId)
      
      ;
    return;
  }

  const contentSummary = [
    meta?.title ? `Title: ${meta.title}` : null,
    meta?.description ? `Description: ${meta.description.substring(0, 300)}` : null,
    meta?.site_name ? `Site: ${meta.site_name}` : null,
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
          { role: "system", content: LINK_ALIGNMENT_PROMPT },
          { role: "user", content: contentSummary },
        ],
        temperature: 0.2,
        max_tokens: 80,
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) throw new Error(`LLM ${res.status}`);

    const data: { choices: Array<{ message: { content: string } }> } = await res.json();
    const parsed: { alignment: "aligned" | "misaligned"; reason?: string } = JSON.parse(
      data.choices[0].message.content
    );

    await supabase
      .from("posts")
      .update({ link_alignment: parsed.alignment })
      .eq("id", postId)
      
      ;
  } catch {
    // LLM failed — clear the "evaluating" state
    await supabase
      .from("posts")
      .update({ link_alignment: null })
      .eq("id", postId)
      
      ;
  }
}
