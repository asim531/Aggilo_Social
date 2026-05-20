import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import {
  buildSageMessages,
  detectCharacterConcern,
  extractSageDecision,
  isSagePostRepetitive,
} from "@/lib/sage-prompt";
import { detectWelfareSignal } from "@/lib/clio-prompt";
import {
  selectGreetingTemplate,
  type HandoffReason,
} from "@/lib/handoff-greetings";
import { fetchLinkMeta, extractFirstUrl } from "@/lib/link-preview";
import { llmCall, updateLogDecision } from "@/lib/llm-fetch";
import { PostWithAuthor, DuaVaultEntry } from "@/lib/types";

/**
 * POST /api/sage/evaluate
 *
 * Called AFTER a post is saved to Supabase — never blocks the user's post submission.
 * Evaluates the post through Sage's decision framework and optionally posts a response.
 *
 * V3 7-principles update:
 *  - All LLM calls go through llmCall(), which records to llm_response_logs
 *    (Principle 2 — closed loops, Principle 7 — token-max measurement).
 *  - Sage's structured decision tag is parsed and logged to
 *    sage_decision_logs (Principle 3 — legible organization).
 *  - Character concern (monotheism guardrail) is detected and logged to
 *    character_concerns; admin sees in dashboard (Cross-cutting Soul rule).
 */
export async function POST(request: Request) {
  try {
    const { post_id } = await request.json();

    if (!post_id) {
      return NextResponse.json({ evaluated: false, error: "Missing post_id" }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: triggeringPost, error: fetchError } = await supabase
      .from("posts")
      .select("*, profiles(*)")
      .eq("id", post_id)
      .single();

    if (fetchError || !triggeringPost) {
      return NextResponse.json({ evaluated: false, error: "Post not found" }, { status: 404 });
    }

    if (triggeringPost.is_sage) {
      return NextResponse.json({ evaluated: true, skipped: "sage_post" });
    }

    // ── Belt-and-braces signal detection ────────────────────────────
    const mentionsSage = /@sage\b/i.test(triggeringPost.content);
    const isWelfare = detectWelfareSignal(triggeringPost.content);
    const characterConcern = detectCharacterConcern(triggeringPost.content);

    if (isWelfare) {
      await supabase
        .from("welfare_notifications")
        .insert({
          post_id: triggeringPost.id,
          user_id: triggeringPost.author_id,
          trigger_content: `[POST] ${triggeringPost.content.substring(0, 500)}`,
          sage_response: null,
          resolved: false,
        });

      await supabase
        .from("posts")
        .update({ thread_state: "welfare_flagged" })
        .eq("id", triggeringPost.id);
    }

    // ── Link detection + metadata fetch (unchanged behaviour) ───────
    const linkUrl = extractFirstUrl(triggeringPost.content);
    if (linkUrl) {
      await supabase
        .from("posts")
        .update({ link_url: linkUrl, link_alignment: "evaluating" })
        .eq("id", triggeringPost.id);
      evaluateLinkAlignment(supabase, triggeringPost.id, linkUrl);
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

    // Recent Sage posts — used for repetition guard
    const { data: recentSagePosts } = await supabase
      .from("posts")
      .select("content, created_at")
      .eq("is_sage", true)
      .order("created_at", { ascending: false })
      .limit(15);

    const messages = buildSageMessages(
      triggeringPost.content,
      (recentPosts as PostWithAuthor[]) || [],
      (vaultEntries as DuaVaultEntry[]) || [],
      {
        mentionsSage,
        isWelfare,
        isCharacterConcern: characterConcern.matched,
        recentSagePosts: (recentSagePosts || []).map((p) => p.content),
      }
    );

    const result = await llmCall(
      {
        agent: "sage",
        operationKey: "sage_evaluate",
        userId: triggeringPost.author_id,
        relatedPostId: triggeringPost.id,
        clusterId: "the_single_source",
      },
      {
        messages,
        temperature: 0.5,
        maxTokens: 800,
      },
      supabase
    );

    if (result.status === "budget_exceeded") {
      // Sage steps back. No response posted, no decision logged.
      return NextResponse.json({ evaluated: true, responded: false, reason: "budget_exceeded" });
    }

    if (result.status === "error" || !result.content) {
      return NextResponse.json(
        { evaluated: false, error: result.errorMessage ?? "LLM unavailable" },
        { status: 502 }
      );
    }

    // ── Parse Sage's structured decision tag ─────────────────────────
    const { visible, decision } = extractSageDecision(result.content);
    let isSilent = visible === "[SAGE_SILENT]" || visible.length === 0;

    // ── Application-layer repetition guard ──────────────────────────
    // Belt-and-braces with the prompt-level guard. If the model still
    // produced a near-duplicate of a recent post, suppress it.
    if (!isSilent) {
      const priorContents = (recentSagePosts || []).map((p) => p.content);
      if (isSagePostRepetitive(visible, priorContents)) {
        isSilent = true;
      }
    }

    // Log Sage's decision regardless of silent or responded
    await supabase.from("sage_decision_logs").insert({
      post_id: triggeringPost.id,
      llm_log_id: result.llmLogId,
      step_matched: isSilent ? "silent" : decision.step,
      step_rationale: decision.rationale,
      vault_id_used: decision.vaultIdUsed,
      response_text: isSilent ? null : visible,
      signals_detected: {
        welfare: isWelfare,
        mentions_sage: mentionsSage,
        character_concern: characterConcern.matched,
        character_signal_type: characterConcern.signalType,
      },
    });

    // ── Character concern logging (Cross-cutting Soul rule) ─────────
    // Log when EITHER the regex matched OR Sage's framework chose 'character'.
    // The two are independent signals; each may catch what the other misses.
    const sageMarkedCharacter = decision.step === "character" && !isSilent;
    if (characterConcern.matched || sageMarkedCharacter) {
      await supabase.from("character_concerns").insert({
        post_id: triggeringPost.id,
        user_id: triggeringPost.author_id,
        signal_type:
          characterConcern.signalType ??
          (sageMarkedCharacter ? "promoting_bad_character" : "other"),
        signal_excerpt: characterConcern.excerpt || triggeringPost.content.substring(0, 500),
        agent_response_text: isSilent ? null : visible,
      });

      // Update llm log decision for clarity
      await updateLogDecision(supabase, result.llmLogId, "character_concern_responded");
    } else {
      await updateLogDecision(
        supabase,
        result.llmLogId,
        isSilent ? "silent" : "responded"
      );
    }

    // Sage chose silence
    if (isSilent) {
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
          .eq("id", triggeringPost.id);

        await supabase
          .from("clio_handoff_greetings")
          .insert({
            triggering_post_id: triggeringPost.id,
            user_id: triggeringPost.author_id,
            handoff_reason: reason,
            greeting_text: template.text,
          });

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
        content: visible,
        is_sage: true,
        is_sage_question: false,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Sage evaluate: failed to save response", insertError);
      return NextResponse.json({ evaluated: false, error: "Failed to save Sage response" }, { status: 500 });
    }

    return NextResponse.json({
      evaluated: true,
      responded: true,
      reply_id: sagePost.id,
      decision: decision.step,
    });
  } catch (error) {
    console.error("Sage evaluate: unexpected error", error);
    return NextResponse.json({ evaluated: false, error: "Unexpected error" }, { status: 500 });
  }
}

// ── Link alignment helper ────────────────────────────────────────────────

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
  url: string
): Promise<void> {
  const meta = await fetchLinkMeta(url);

  if (meta) {
    await supabase
      .from("posts")
      .update({ link_meta: meta })
      .eq("id", postId);
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
    const result = await llmCall(
      {
        agent: "link_alignment",
        operationKey: "link_alignment_check",
        relatedPostId: postId,
        clusterId: "the_single_source",
      },
      {
        messages: [
          { role: "system", content: LINK_ALIGNMENT_PROMPT },
          { role: "user", content: contentSummary },
        ],
        temperature: 0.2,
        maxTokens: 80,
        responseFormat: { type: "json_object" },
        timeoutMs: 15000,
      },
      supabase
    );

    if (result.status !== "ok" || !result.content) {
      await supabase.from("posts").update({ link_alignment: null }).eq("id", postId);
      return;
    }

    const parsed: { alignment: "aligned" | "misaligned"; reason?: string } = JSON.parse(
      result.content
    );

    await supabase
      .from("posts")
      .update({ link_alignment: parsed.alignment })
      .eq("id", postId);

    await updateLogDecision(supabase, result.llmLogId, parsed.alignment);
  } catch {
    await supabase.from("posts").update({ link_alignment: null }).eq("id", postId);
  }
}
