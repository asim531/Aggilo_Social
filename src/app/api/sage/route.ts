import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { buildSageMessages } from "@/lib/sage-prompt";
import { SageRequest, SageResponse, ChatCompletionResponse, PostWithAuthor, DuaVaultEntry } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body: SageRequest = await request.json();
    const { message, post_id } = body;

    if (!message || !post_id) {
      return NextResponse.json(
        { success: false, error: "Missing message or post_id" } satisfies SageResponse,
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" } satisfies SageResponse,
        { status: 401 }
      );
    }

    // Fetch recent posts for conversational context
    const { data: recentPosts } = await supabase
      .from("posts")
      .select("*, profiles(*)")
      .order("created_at", { ascending: true })
      .limit(20);

    // Query the dua vault for relevant references
    // For MVP, we fetch all verified entries and let the LLM match thematically
    const { data: vaultEntries } = await supabase
      .from("dua_vault")
      .select("*")
      .eq("verified_by_founder", true)
      .limit(10);

    const messages = buildSageMessages(
      message,
      (recentPosts as PostWithAuthor[]) || [],
      (vaultEntries as DuaVaultEntry[]) || []
    );

    const llmBaseUrl = process.env.LLM_BASE_URL;
    const llmApiKey = process.env.LLM_API_KEY;
    const llmModel = process.env.LLM_MODEL;

    if (!llmBaseUrl || !llmApiKey || !llmModel) {
      console.error("Missing LLM environment variables");
      return NextResponse.json(
        {
          success: false,
          error: "Sage is not configured. Check LLM_BASE_URL, LLM_API_KEY, LLM_MODEL.",
        } satisfies SageResponse,
        { status: 500 }
      );
    }

    const llmResponse = await fetch(`${llmBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${llmApiKey}`,
      },
      body: JSON.stringify({
        model: llmModel,
        messages: messages,
        temperature: 0.5,
        max_tokens: 800,
      }),
    });

    if (!llmResponse.ok) {
      const errorText = await llmResponse.text();
      console.error("LLM API error:", llmResponse.status, errorText);
      return NextResponse.json(
        {
          success: false,
          error: "Sage is momentarily unavailable. Please try again.",
        } satisfies SageResponse,
        { status: 502 }
      );
    }

    const llmData: ChatCompletionResponse = await llmResponse.json();
    const sageContent = llmData.choices?.[0]?.message?.content;

    if (!sageContent) {
      return NextResponse.json(
        {
          success: false,
          error: "Sage returned an empty response. Please try again.",
        } satisfies SageResponse,
        { status: 500 }
      );
    }

    // If Sage decides silence is the correct response, don't post
    if (sageContent.trim() === "[SAGE_SILENT]") {
      return NextResponse.json({
        success: true,
        content: "",
      } satisfies SageResponse);
    }

    const { data: sagePost, error: insertError } = await supabase
      .from("posts")
      .insert({
        author_id: null,
        parent_id: post_id,
        content: sageContent.trim(),
        is_sage: true,
        is_sage_question: false,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to save Sage post:", insertError);
      return NextResponse.json(
        {
          success: false,
          error: "Sage responded but we couldn't save it. Please try again.",
        } satisfies SageResponse,
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      reply_id: sagePost.id,
      content: sageContent.trim(),
    } satisfies SageResponse);
  } catch (error) {
    console.error("Sage API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred. Please try again.",
      } satisfies SageResponse,
      { status: 500 }
    );
  }
}
