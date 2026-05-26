import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { CLUSTER_ID } from "@/lib/cluster";
import { llmCall } from "@/lib/llm";

export async function POST(req: Request) {
  try {
    const { userId, nickname, gender, country } = await req.json();
    if (!userId || !nickname) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = createAdminClient();
    
    // Check if they already have a welcome tip
    const { data: existingTips } = await supabase
      .from("clio_tip_log")
      .select("id")
      .eq("user_id", userId)
      .eq("cluster_id", CLUSTER_ID)
      .eq("trigger_type", "welcome");

    if (existingTips && existingTips.length > 0) {
      return NextResponse.json({ success: true, message: "Already welcomed" });
    }

    // Generate unique welcome tip
    const systemPrompt = `You are Clio, an AI companion in the Long Conversation space.
You are welcoming a new member named ${nickname} to the room. ${country ? `They are joining from ${country}.` : ""}
Generate a short, unique welcome tip (max 2 sentences) to help them settle in. 
Make it warm but direct, distinct from generic greetings. Encourage them to observe the timeline or share a thought.
Do not use emojis.`;

    const result = await llmCall({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Generate the welcome tip now." }
      ],
      temperature: 0.8
    });

    const tipContent = result.content;
    if (!tipContent) {
      throw new Error("Empty tip generated");
    }

    // Insert tip
    const tipRow = {
      cluster_id: CLUSTER_ID,
      user_id: userId,
      trigger_type: "welcome",
      tip_content: tipContent.trim(),
      tip_delivered_at: new Date().toISOString(),
      member_acted: null,
      suppression_reason: null,
    };

    const { error: insertError } = await supabase
      .from("clio_tip_log")
      .insert(tipRow);
      
    if (insertError) {
      console.error("Failed to insert welcome tip", insertError);
      return NextResponse.json({ error: "DB Error" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Welcome tip generation error:", error);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
