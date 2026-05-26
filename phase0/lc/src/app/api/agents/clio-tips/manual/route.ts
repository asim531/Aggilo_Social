import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { CLUSTER_ID } from "@/lib/cluster";
import { llmCall } from "@/lib/llm";

export async function POST(req: Request) {
  try {
    const { userId, nickname } = await req.json();
    if (!userId || !nickname) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = createAdminClient();
    
    // Generate manual tip
    const systemPrompt = `You are Clio, an AI companion in the Long Conversation space.
The user ${nickname} explicitly clicked "Tip me, Clio" because they want a prompt or an idea to post about.
Generate a short, unique question or prompt (max 2 sentences) to inspire them.
Examples of the tone: "What's the conversation you keep almost having?" or "Say the thing that's actually true."
Make it thought-provoking but not overly dramatic. Do not use emojis.`;

    const result = await llmCall({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Generate the prompt now." }
      ],
      temperature: 0.9
    });

    const tipContent = result.content;
    if (!tipContent) {
      throw new Error("Empty tip generated");
    }

    // Insert tip
    const tipRow = {
      cluster_id: CLUSTER_ID,
      user_id: userId,
      trigger_type: "manual_request",
      tip_content: tipContent.trim(),
      tip_delivered_at: new Date().toISOString(),
      member_acted: null,
      suppression_reason: null,
    };

    const { error: insertError } = await supabase
      .from("clio_tip_log")
      .insert(tipRow);
      
    if (insertError) {
      console.error("Failed to insert manual tip", insertError);
      return NextResponse.json({ error: "DB Error" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Manual tip generation error:", error);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
