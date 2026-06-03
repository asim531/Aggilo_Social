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

    // Fetch the user's previous tips so Clio never repeats herself.
    const { data: pastTips } = await supabase
      .from("clio_tip_log")
      .select("tip_content")
      .eq("cluster_id", CLUSTER_ID)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(15);

    const pastTipsList = (pastTips ?? []).map((t) => t.tip_content).filter(Boolean);
    const pastTipsBlock = pastTipsList.length > 0
      ? `\nYou have already given this user the following tips. Do NOT repeat any of them — generate something completely new and different:\n${pastTipsList.map((t, i) => `${i + 1}. "${t}"`).join("\n")}`
      : "";
    
    // Generate manual tip
    const systemPrompt = `You are Clio, an AI companion in the Research Circle MJ space.
The user ${nickname} explicitly clicked "Tip me, Clio" because they want a prompt or an idea to post about.
Generate an extremely concise, apt, and punchy question or prompt to inspire them.
CRITICAL RULES:
1. Maximum 1 short sentence.
2. Absolutely no introductory filler (e.g., do not say "Here is a prompt:").
3. Make it research-relevant but not overly academic. Invite sharing of work-in-progress, a methodological question, a useful resource, or an observation about their field.
4. Do not use emojis.
Examples of the tone: "What's the draft you're avoiding showing anyone?" or "What method are you using that no one in your department understands?" or "Share the paper that changed how you think about your field."${pastTipsBlock}`;

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
