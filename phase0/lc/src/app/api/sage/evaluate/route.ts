import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { CLUSTER_ID } from "@/lib/cluster";
import { llmCall } from "@/lib/llm";
import {
  buildSageMessages,
  extractSageDecision,
  isSageSilent,
  stripDecisionTag,
} from "@/lib/prompts/sage-builder";
import { detectWelfareSignal } from "@/lib/welfare";
import type { PostWithAuthor } from "@/lib/types";

/**
 * POST /api/sage/evaluate
 *
 * Async worker triggered by PostComposer (fire-and-forget) after a
 * member posts. The user does NOT wait for this — Sage's response,
 * if any, lands as a separate post via Realtime.
 *
 * Flow:
 *   1. Verify the post belongs to the cluster.
 *   2. Welfare regex pre-filter — if it fires, skip the LLM and write
 *      a deterministic care-witness response + flag the thread
 *      welfare_flagged. The platform safety floor never relies on the
 *      LLM alone.
 *   3. Build context: the new post + recent timeline + Sage's recent
 *      posts (so she can avoid repeating herself).
 *   4. Call the LLM with the layered Sage prompt.
 *   5. Parse the decision tag, strip it, and post the response if
 *      non-silent.
 *   6. Use the admin client to insert Sage's post (system_sage author,
 *      author_id null). Realtime delivers it to all members.
 *
 * Idempotency: a post can only have one Sage evaluation. We don't
 * currently dedupe — for Phase 0 the cost of a double-evaluation is
 * a duplicate Sage post, which is bad but rare. Phase 1 will add a
 * sage_evaluated_at column and idempotency check.
 */
export async function POST(request: Request) {
  try {
    const { post_id } = await request.json();
    if (!post_id || typeof post_id !== "string") {
      return NextResponse.json({ error: "post_id required" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // Fetch the post and confirm cluster scope.
    const { data: postRow, error: postErr } = await supabase
      .from("posts")
      .select("*, profiles(*)")
      .eq("id", post_id)
      .eq("cluster_id", CLUSTER_ID)
      .maybeSingle();

    if (postErr || !postRow) {
      return NextResponse.json({ error: "post not found" }, { status: 404 });
    }
    const post = postRow as PostWithAuthor;

    // Skip if the post is from Sage herself.
    if (post.is_sage) {
      return NextResponse.json({ outcome: "skipped_sage_post" });
    }

    // ── Welfare pre-filter ────────────────────────────────────────
    if (detectWelfareSignal(post.content)) {
      await handleWelfarePost(post);
      return NextResponse.json({ outcome: "welfare_routed" });
    }

    // ── @Sage mention detection ───────────────────────────────────
    // When a member explicitly addresses Sage (per CLUSTER_DESCRIPTION
    // §5: "Members can call her with @Sage"), the LLM gets a hint
    // that silence is not the right answer. The standard 6-step
    // framework still runs — Sage may witness, ask a depth question,
    // reframe, or limit scope — but [SAGE_SILENT] is no longer a
    // valid output.
    const isMentioned = /\b@sage\b/i.test(post.content);

    // ── Context assembly ─────────────────────────────────────────
    // Recent posts (up to 10) for room context.
    const { data: recentRows } = await supabase
      .from("posts")
      .select("is_sage, content, profiles(nickname)")
      .eq("cluster_id", CLUSTER_ID)
      .order("created_at", { ascending: false })
      .limit(10);
    const recentPosts =
      (recentRows ?? []).reverse().map((r) => ({
        is_sage: Boolean(r.is_sage),
        content: String(r.content ?? ""),
        nickname:
          (r.profiles as { nickname?: string } | null)?.nickname ?? null,
      }));

    // Sage's own recent posts for repetition awareness.
    const { data: sageRows } = await supabase
      .from("posts")
      .select("content")
      .eq("cluster_id", CLUSTER_ID)
      .eq("is_sage", true)
      .order("created_at", { ascending: false })
      .limit(15);
    const recentSagePosts = (sageRows ?? []).map((r) => String(r.content ?? ""));

    // ── LLM call ──────────────────────────────────────────────────
    const messages = buildSageMessages({
      memberMessage: post.content,
      recentPosts,
      recentSagePosts,
      isMentioned,
    });

    let llmResponse: string;
    try {
      const result = await llmCall({
        messages,
        operationKey: "sage_evaluate",
        temperature: 0.5,
        maxTokens: 350,
      });
      llmResponse = result.content;
    } catch (err) {
      // LLM failure is acceptable — Sage staying silent is a valid
      // outcome. We log and exit cleanly.
      console.warn(
        "[sage/evaluate] LLM call failed:",
        err instanceof Error ? err.message : String(err)
      );
      return NextResponse.json({ outcome: "llm_error" });
    }

    const decision = extractSageDecision(llmResponse);

    if (isSageSilent(llmResponse) || decision.step === "silent") {
      return NextResponse.json({ outcome: "silent", step: decision.step });
    }

    const responseContent = stripDecisionTag(llmResponse).trim();
    if (!responseContent) {
      return NextResponse.json({ outcome: "empty_after_strip" });
    }

    // ── Post Sage's response ──────────────────────────────────────
    // Use the admin client because Sage posts have author_id = null,
    // which RLS would reject under the standard "auth.uid() = author_id"
    // policy. The service role bypasses RLS.
    //
    // Threading rule: Sage's response attaches as a reply to the
    // triggering post. This keeps the conversation visually grouped —
    // member's post and Sage's response live in the same thread card.
    // If the triggering post is itself a reply, Sage replies to the
    // root of that thread (post.parent_id) rather than nesting two
    // levels deep, since the cluster intentionally keeps threads
    // shallow (one level of replies).
    const admin = createAdminClient();
    const replyParentId = post.parent_id ?? post.id;
    const { error: insertErr } = await admin.from("posts").insert({
      cluster_id: CLUSTER_ID,
      author_id: null,
      parent_id: replyParentId,
      content: responseContent,
      is_sage: true,
      is_sage_question: decision.step === "depth_question",
      thread_state: "attended",
    });

    if (insertErr) {
      console.warn(
        "[sage/evaluate] Sage post insert failed:",
        insertErr.message
      );
      return NextResponse.json({ outcome: "insert_failed" });
    }

    return NextResponse.json({ outcome: "posted", step: decision.step });
  } catch (err) {
    console.warn(
      "[sage/evaluate] unexpected error:",
      err instanceof Error ? err.message : String(err)
    );
    return NextResponse.json({ outcome: "error" }, { status: 500 });
  }
}

/**
 * Handle a welfare-flagged post.
 *
 * The platform safety floor requires:
 *   1. A deterministic care-witness response from Sage (NOT LLM-generated)
 *   2. Setting the post's thread_state to "welfare_flagged"
 *   3. Writing a row to welfare_notifications for admin review
 *
 * Phase 0 implementation: we write the deterministic Sage post and flag
 * the thread. The welfare_notifications table and admin UI come in a
 * later batch. For now, the platform admin sees these via the
 * thread_state column on posts.
 */
async function handleWelfarePost(post: PostWithAuthor) {
  const admin = createAdminClient();

  // Deterministic care-witness response. Two sentences:
  //   1. Witness without diagnosing
  //   2. Name where care comes from
  const careWitness =
    "What you're carrying is real, and it matters. Someone from this community will reach out to you.";

  // Mark the originating post as welfare_flagged so the admin queue
  // can surface it. If the originating post is a reply, mark the
  // parent thread too so the visual cue is correct in the feed.
  await admin
    .from("posts")
    .update({ thread_state: "welfare_flagged" })
    .eq("id", post.id);

  if (post.parent_id) {
    await admin
      .from("posts")
      .update({ thread_state: "welfare_flagged" })
      .eq("id", post.parent_id);
  }

  // Sage's care-witness post. Threaded as a reply at the root level
  // so it groups with the originating post in the feed.
  const replyParentId = post.parent_id ?? post.id;
  await admin.from("posts").insert({
    cluster_id: CLUSTER_ID,
    author_id: null,
    content: careWitness,
    is_sage: true,
    is_sage_question: false,
    thread_state: "welfare_flagged",
    parent_id: replyParentId,
  });

  // Welfare notification for the admin queue. Best-effort — never
  // blocks the care-witness post.
  if (post.author_id) {
    try {
      await admin.from("welfare_notifications").insert({
        cluster_id: CLUSTER_ID,
        user_id: post.author_id,
        post_id: post.id,
        trigger_content: post.content.slice(0, 500),
        source: "sage_post",
        sage_response: careWitness,
        resolved: false,
      });
    } catch {
      // Logged elsewhere; don't block the safety floor on insert
      // failure.
    }
  }
}
