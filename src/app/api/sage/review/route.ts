import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { buildSageMessages } from "@/lib/sage-prompt";
import { ChatCompletionResponse, PostWithAuthor, DuaVaultEntry } from "@/lib/types";

const WELFARE_PATTERNS = [
  /can'?t\s+(make\s+myself\s+)?pray/i,
  /haven'?t\s+been\s+able\s+to\s+(pray|read\s+quran)/i,
  /don'?t\s+see\s+the\s+point/i,
  /allah\s+doesn'?t\s+hear/i,
  /nobody\s+i\s+can\s+talk\s+to/i,
  /completely\s+alone/i,
  /no\s+one\s+(cares|listens|understands)/i,
  /want\s+to\s+(die|end|disappear|give\s+up)/i,
  /self[- ]?harm/i,
  /hurt\s+myself/i,
  /can'?t\s+go\s+on/i,
  /forced\s+(to|into)\s+(marry|wear|cover)/i,
  /no\s+way\s+out/i,
];

function detectWelfareSignal(userContent: string, sageResponse: string): boolean {
  for (const pattern of WELFARE_PATTERNS) {
    if (pattern.test(userContent)) return true;
  }
  if (/welfare|escalat|founder.*reach/i.test(sageResponse)) return true;
  return false;
}

export async function POST(request: Request) {
  try {
    const { postId, clusterId } = await request.json();

    if (!postId) {
      return NextResponse.json({ error: "Missing postId" }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: post } = await supabase
      .from("posts")
      .select("*, profiles(*)")
      .eq("id", postId)
      .single();

    if (!post || post.is_sage) {
      return NextResponse.json({ skipped: true });
    }

    const { data: recentPosts } = await supabase
      .from("posts")
      .select("*, profiles(*)")
      .order("created_at", { ascending: true })
      .limit(20);

    const { data: vaultEntries } = await supabase
      .from("dua_vault")
      .select("*")
      .eq("verified_by_founder", true)
      .limit(10);

    const messages = buildSageMessages(
      post.content,
      (recentPosts as PostWithAuthor[]) || [],
      (vaultEntries as DuaVaultEntry[]) || []
    );

    const llmBaseUrl = process.env.LLM_BASE_URL;
    const llmApiKey = process.env.LLM_API_KEY;
    const llmModel = process.env.LLM_MODEL;

    if (!llmBaseUrl || !llmApiKey || !llmModel) {
      console.error("Missing LLM environment variables");
      return NextResponse.json({ error: "LLM not configured" }, { status: 500 });
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
      const errorText = await llmResponse.text();
      console.error("LLM API error:", llmResponse.status, errorText);
      return NextResponse.json({ error: "LLM unavailable" }, { status: 502 });
    }

    const llmData: ChatCompletionResponse = await llmResponse.json();
    const sageContent = llmData.choices?.[0]?.message?.content;

    if (!sageContent || sageContent.trim() === "[SAGE_SILENT]") {
      return NextResponse.json({ silent: true });
    }

    const isWelfareResponse = detectWelfareSignal(post.content, sageContent);

    if (isWelfareResponse) {
      await supabase
        .from("posts")
        .update({ thread_state: "welfare_flagged" })
        .eq("id", postId);

      await supabase
        .from("welfare_notifications")
        .insert({
          post_id: postId,
          user_id: post.author_id,
          trigger_content: post.content.substring(0, 500),
          sage_response: sageContent.trim().substring(0, 500),
          resolved: false,
        });
    }

    const { error: insertError } = await supabase
      .from("posts")
      .insert({
        author_id: null,
        parent_id: postId,
        content: sageContent.trim(),
        is_sage: true,
        is_sage_question: false,
      });

    if (insertError) {
      console.error("Failed to save Sage post:", insertError);
      return NextResponse.json({ error: "Insert failed" }, { status: 500 });
    }

    return NextResponse.json({ responded: true });
  } catch (error) {
    console.error("Sage review error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
