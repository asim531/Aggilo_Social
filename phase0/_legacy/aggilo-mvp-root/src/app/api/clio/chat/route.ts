import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { PostWithAuthor, DuaVaultEntry } from "@/lib/types";
import { buildClioClusterMessages, detectWelfareSignal } from "@/lib/clio-prompt";
import { llmCall } from "@/lib/llm-fetch";

/**
 * POST /api/clio/chat
 *
 * Cluster-mode Clio. Persistent (in conversation, not yet in DB for MVP).
 * V3 update: routed through llmCall() for full observability + fallback.
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
        // pre-migration — fail silent
      }
    }

    const { data: recentPosts } = await supabase
      .from("posts")
      .select("*, profiles(*)")
      .order("created_at", { ascending: false })
      .limit(10);

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

    const result = await llmCall(
      {
        agent: "clio",
        operationKey: "clio_chat",
        userId: user.id,
        clusterId: "the_single_source",
      },
      {
        messages,
        temperature: 0.6,
        maxTokens: 400,
      },
      supabase
    );

    if (result.status === "budget_exceeded") {
      return NextResponse.json({
        content: result.content,
        welfare_flagged: isWelfare,
        budget_exceeded: true,
      });
    }

    if (result.status === "error" || !result.content) {
      return NextResponse.json({
        content: "I'm having a moment. Try again shortly.",
        welfare_flagged: isWelfare,
      });
    }

    return NextResponse.json({
      content: result.content,
      welfare_flagged: isWelfare,
      llm_log_id: result.llmLogId,
    });
  } catch (error) {
    console.error("Clio chat error:", error);
    return NextResponse.json({
      content: "Something went wrong. Try again in a moment.",
    });
  }
}
