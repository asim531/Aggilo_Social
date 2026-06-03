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

    // Fetch the post and confirm cluster scope. Two-step fetch to
    // avoid PostgREST FK-disambiguation issues on the embed.
    const { data: postRow, error: postErr } = await supabase
      .from("posts")
      .select("*")
      .eq("id", post_id)
      .eq("cluster_id", CLUSTER_ID)
      .maybeSingle();

    if (postErr || !postRow) {
      return NextResponse.json({ error: "post not found" }, { status: 404 });
    }
    let post = postRow as PostWithAuthor;

    // Hydrate the author profile separately for log context.
    if (post.author_id) {
      const { data: authorProfile } = await supabase
        .from("profiles")
        .select("id, cluster_id, nickname, role")
        .eq("id", post.author_id)
        .eq("cluster_id", CLUSTER_ID)
        .maybeSingle();
      if (authorProfile) {
        post = { ...post, profiles: authorProfile as PostWithAuthor["profiles"] };
      }
    }

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
    const isMentioned = /@sage\b/i.test(post.content);

    // ── Context assembly ─────────────────────────────────────────
    // Recent posts (up to 10) for room context. Two-step fetch to
    // avoid embed-ambiguity issues.
    const { data: recentRows } = await supabase
      .from("posts")
      .select("is_sage, content, author_id")
      .eq("cluster_id", CLUSTER_ID)
      .order("created_at", { ascending: false })
      .limit(10);

    // Bulk-fetch the author profiles for the recent posts.
    const recentAuthorIds = Array.from(
      new Set(
        (recentRows ?? [])
          .map((r) => r.author_id)
          .filter((id): id is string => Boolean(id))
      )
    );
    const { data: recentProfiles } = recentAuthorIds.length
      ? await supabase
          .from("profiles")
          .select("id, nickname")
          .eq("cluster_id", CLUSTER_ID)
          .in("id", recentAuthorIds)
      : { data: [] };
    const nicknameById = new Map<string, string>(
      ((recentProfiles ?? []) as Array<{ id: string; nickname: string }>).map(
        (p) => [p.id, p.nickname]
      )
    );

    const recentPosts = (recentRows ?? []).reverse().map((r) => ({
      is_sage: Boolean(r.is_sage),
      content: String(r.content ?? ""),
      nickname: r.author_id ? nicknameById.get(r.author_id) ?? null : null,
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

    // ── Topic inference (async, non-blocking) ────────────────────
    // Sage reads every post for topic relevance. We fire a lightweight
    // LLM call to suggest topics, then create/link them. This happens
    // after Sage's public response so it never delays the member-facing
    // output.
    void inferAndLinkTopics(post.id, post.content);

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

/**
 * Infer topics from a post and link them via post_topics.
 * Lightweight LLM call — non-blocking, fire-and-forget.
 */
async function inferAndLinkTopics(postId: string, content: string) {
  try {
    const admin = createAdminClient();

    // Fetch existing topics for this cluster so the LLM can reuse them
    const { data: existingTopics } = await admin
      .from("topics")
      .select("id, name, slug")
      .eq("cluster_id", CLUSTER_ID);

    const topicList = (existingTopics ?? [])
      .map((t: { slug: string; name: string }) => `${t.slug}: ${t.name}`)
      .join("\n");

    const prompt = `You are Sage, the cluster Anchor for Research Circle MJ — a research workspace for faculty and researchers.

Read this post and suggest 1-3 research topics it belongs to. You may reuse existing topics from the list below, or propose new ones if none fit.

Existing topics (slug: name):
${topicList || "(none yet — this cluster is new)"}

Post content:
"""
${content}
"""

Output ONLY valid JSON in this exact shape (no prose before or after):
{
  "topics": [
    { "name": "Short topic name", "reason": "one sentence why" }
  ]
}

Rules:
- 1-3 topics max.
- Names are 2-4 words, title case.
- If an existing topic matches, reuse its exact name.
- If none match, propose a new name.
- Be conservative: off-topic or generic small-talk gets an empty array.`;

    const result = await llmCall({
      messages: [
        { role: "system", content: "You are a research-topic classifier. Output JSON only." },
        { role: "user", content: prompt },
      ],
      operationKey: "sage_topic_inference",
      temperature: 0.3,
      maxTokens: 200,
      responseFormat: { type: "json_object" },
    });

    let inferred: { topics?: Array<{ name: string; reason: string }> } = {};
    try {
      inferred = JSON.parse(result.content);
    } catch {
      return; // malformed JSON — skip silently
    }

    const suggestions = inferred.topics ?? [];
    if (suggestions.length === 0) return;

    // Map topic names to IDs (create missing ones)
    const topicIds: string[] = [];
    for (const suggestion of suggestions) {
      const name = suggestion.name.trim();
      if (!name) continue;

      // Try to find existing topic by name (case-insensitive)
      const existing = (existingTopics ?? []).find(
        (t: { name: string }) => t.name.toLowerCase() === name.toLowerCase()
      );

      if (existing) {
        topicIds.push(existing.id as string);
        continue;
      }

      // Create new topic
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      const { data: newTopic, error } = await admin
        .from("topics")
        .insert({
          cluster_id: CLUSTER_ID,
          slug,
          name,
          color: pickTopicColor(topicIds.length),
        })
        .select("id")
        .single();

      if (!error && newTopic) {
        topicIds.push(newTopic.id as string);
      }
    }

    if (topicIds.length === 0) return;

    // Link to post
    const rows = topicIds.map((topicId) => ({
      post_id: postId,
      topic_id: topicId,
      added_by: "sage" as const,
    }));

    await admin.from("post_topics").insert(rows);
  } catch (err) {
    console.warn(
      "[sage/evaluate] topic inference failed:",
      err instanceof Error ? err.message : String(err)
    );
    // Non-critical — don't block the main flow
  }
}

function pickTopicColor(index: number): string {
  const colors = [
    "amber", "teal", "rose", "violet", "emerald",
    "sky", "orange", "indigo", "lime", "fuchsia",
  ];
  return colors[index % colors.length];
}
