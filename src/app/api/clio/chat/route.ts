import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { ChatCompletionResponse, PostWithAuthor, DuaVaultEntry } from "@/lib/types";
import { buildClioClusterMessages, detectWelfareSignal } from "@/lib/clio-prompt";
import { llmFetch } from "@/lib/llm-fetch";

/**
 * POST /api/clio/chat
 *
 * Cluster-mode Clio. Persistent (in conversation, not yet in DB for MVP).
 * Refactored in V3 Phase 6 to use shared builder + welfare detection.
 */
export async function POST(request: Request) {
  try {
    const { message, conversationContext } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "Missing message" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("nickname")
      .eq("id", user.id)
      .single();

    // Belt-and-braces welfare check at the app layer
    const isWelfare = detectWelfareSignal(message);
    if (isWelfare) {
      try {
        await supabase
          .from("welfare_notifications")
          .insert({
            post_id: null,
            user_id: user.id,
            trigger_content: `[CLIO_CHAT] ${message.substring(0, 500)}`,
            sage_response: null,
            resolved: false,
          });
      } catch {
        // Table may not exist (pre-migration) — fail silent
      }
    }

    // Pull recent cluster posts for awareness (last 10)
    const { data: recentPosts } = await supabase
      .from("posts")
      .select("*, profiles(*)")
      .order("created_at", { ascending: false })
      .limit(10);

    // Optional vault read-only context
    const { data: vaultEntries } = await supabase
      .from("dua_vault")
      .select("id, title, source_collection, hadith_grade")
      .eq("verified_by_founder", true)
      .limit(20);

    const messages = buildClioClusterMessages({
      userMessage: message,
      conversationHistory: conversationContext || [],
      recentPosts: ((recentPosts || []) as PostWithAuthor[]).reverse(),
      vaultEntries: (vaultEntries || []) as DuaVaultEntry[],
      memberNickname: profile?.nickname,
    });

    const llmBaseUrl = process.env.LLM_BASE_URL;
    const llmApiKey = process.env.LLM_API_KEY;
    const llmModel = process.env.LLM_MODEL;

    if (!llmBaseUrl || !llmApiKey || !llmModel) {
      return NextResponse.json({
        content: "I'm not fully set up yet. The community is working on it.",
      });
    }

    const llmResponse = await llmFetch(`${llmBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${llmApiKey}`,
      },
      body: JSON.stringify({
        model: llmModel,
        messages,
        temperature: 0.6,
        max_tokens: 400,
      }),
    });

    if (!llmResponse.ok) {
      console.error("Clio chat LLM error:", llmResponse.status);
      return NextResponse.json({
        content: "I'm having a moment. Try again shortly.",
      });
    }

    const data: ChatCompletionResponse = await llmResponse.json();
    const content = data.choices?.[0]?.message?.content?.trim() || "I couldn't form a response. Try again.";

    return NextResponse.json({ content, welfare_flagged: isWelfare });
  } catch (error) {
    console.error("Clio chat error:", error);
    return NextResponse.json({
      content: "Something went wrong. Try again in a moment.",
    });
  }
}
