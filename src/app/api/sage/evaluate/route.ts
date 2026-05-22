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
import { extractFirstUrl } from "@/lib/link-preview";
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

    // ── Link detection + delegate to /api/links/unfurl ─────────────
    // V3.11 fold: this route used to carry its own LINK_ALIGNMENT_PROMPT
    // and evaluateLinkAlignment helper that bypassed llmCall() and
    // duplicated the prompt in /api/links/unfurl. Both have been removed.
    // The unfurl endpoint is the single source of truth for link
    // alignment and handles caching, observability, and the three-state
    // verdict. We simply mark the post as "evaluating" and fire a
    // request to the unfurl endpoint; the unfurl response writes the
    // verdict to link_previews and we sync it onto the post in a
    // background task.
    const linkUrl = extractFirstUrl(triggeringPost.content);
    if (linkUrl) {
      await supabase
        .from("posts")
        .update({ link_url: linkUrl, link_alignment: "evaluating" })
        .eq("id", triggeringPost.id);
      void syncLinkAlignment(supabase, triggeringPost.id, linkUrl, request);
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

    // Recent Sage posts — used for repetition guard AND vault-ID dedup
    const { data: recentSagePosts } = await supabase
      .from("posts")
      .select("id, content, created_at")
      .eq("is_sage", true)
      .order("created_at", { ascending: false })
      .limit(15);

    // ── Vault-ID dedup map ───────────────────────────────────────────
    // If a vault entry was already posted in the last 14 days, Sage
    // should NOT re-post the full dua. Instead she posts a reply-style
    // pointer to the existing post. This prevents the same dua appearing
    // twice in the room within a fortnight.
    const fourteenDaysAgo = new Date(
      Date.now() - 14 * 24 * 60 * 60 * 1000
    ).toISOString();
    const { data: recentDuaPosts } = await supabase
      .from("posts")
      .select("id, content, created_at")
      .eq("is_sage", true)
      .gte("created_at", fourteenDaysAgo);

    const vaultIdToPostId = new Map<string, string>();
    (recentDuaPosts || []).forEach((p: { id: string; content: string }) => {
      const m = p.content.match(/\[DUA_VAULT_ID:([0-9a-f-]+)\]/i);
      if (m) vaultIdToPostId.set(m[1], p.id);
    });

    const messages = buildSageMessages(
      triggeringPost.content,
      (recentPosts as PostWithAuthor[]) || [],
      (vaultEntries as DuaVaultEntry[]) || [],
      {
        mentionsSage,
        isWelfare,
        isCharacterConcern: characterConcern.matched,
        recentSagePosts: (recentSagePosts || []).map((p) => p.content),      }
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
      const priorContents = (recentSagePosts || []).map((p: { content: string }) => p.content);
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

    // ── Vault-ID repetition check ────────────────────────────────────
    // If Sage's response contains a DUA_VAULT_ID marker for a dua that
    // was already posted in the last 14 days, replace the full dua with
    // a reply-style pointer to the existing post. This is contextually
    // directed at the member (it's a reply, not a standalone post) and
    // preserves the sense that Sage is attentive and non-repetitive.
    if (!isSilent && decision.vaultIdUsed && vaultIdToPostId.has(decision.vaultIdUsed)) {
      const existingPostId = vaultIdToPostId.get(decision.vaultIdUsed)!;
      const pointerContent = `We've shared this reference before — it may be relevant here.\n\n[POINTER_TO_POST:${existingPostId}]\nTap to scroll up to it.`;

      const { data: pointerPost, error: pointerErr } = await supabase
        .from("posts")
        .insert({
          author_id: null,
          parent_id: post_id,
          content: pointerContent,
          is_sage: true,
          is_sage_question: false,
          post_subtype: "host_content",
        })
        .select()
        .single();

      if (pointerErr) {
        console.error("Sage evaluate: failed to save pointer", pointerErr);
      }

      await updateLogDecision(supabase, result.llmLogId, "pointer_to_existing");

      return NextResponse.json({
        evaluated: true,
        responded: true,
        pointer: true,
        reply_id: pointerPost?.id,
        existing_post_id: existingPostId,
      });
    }

    // Sage chose silence
    if (isSilent) {      const shouldHandoff = isWelfare && triggeringPost.author_id;

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

// ── Link alignment sync (delegates to /api/links/unfurl) ─────────────────
//
// Posts the URL to the unfurl endpoint, which owns the prompt + cache.
// When unfurl returns a verdict, we map it onto the post's link_alignment
// column ("aligned" | "misaligned" | null) so existing UI continues to
// work. The unfurl verdict has three states (on_topic / off_topic /
// unsure); we treat "unsure" as null on the post column so the badge
// stays neutral, matching the legacy behaviour.

interface UnfurlResponse {
  preview?: {
    sage_verdict?: "on_topic" | "off_topic" | "unsure" | null;
    sage_reason?: string | null;
  };
}

async function syncLinkAlignment(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  postId: string,
  url: string,
  request: Request
): Promise<void> {
  try {
    // Same-origin POST to the unfurl endpoint. Read the host from the
    // incoming request so we work in dev (localhost) and prod alike.
    const origin = new URL(request.url).origin;
    const res = await fetch(`${origin}/api/links/unfurl`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) {
      await supabase.from("posts").update({ link_alignment: null }).eq("id", postId);
      return;
    }
    const data: UnfurlResponse = await res.json();
    const verdict = data.preview?.sage_verdict ?? null;
    const alignment =
      verdict === "on_topic"
        ? "aligned"
        : verdict === "off_topic"
          ? "misaligned"
          : null;
    await supabase
      .from("posts")
      .update({ link_alignment: alignment })
      .eq("id", postId);
  } catch {
    await supabase.from("posts").update({ link_alignment: null }).eq("id", postId);
  }
}
