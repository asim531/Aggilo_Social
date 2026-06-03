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
    const systemPrompt = `You are Clio. You are greeting ${nickname}, who just entered Research Circle MJ for the first time. ${country ? `They are joining from ${country}.` : ""}

Your greeting must be:
- Exactly 1 sentence. 2 sentences only if the first is under 5 words.
- Warm but not saccharine — like someone who actually wants them here, not a host at a conference.
- Specific to this room. Research Circle MJ is for faculty and researchers at MJ College to share work and keep ideas traceable. Documents, images, videos, and links are all topic-linkable. Every post is public. The value is in what people actually share.
- Use their name once, naturally.
- Never generic. Do NOT use: "welcome", "glad you're here", "we're excited", "community", "space", "settle in", "feel free", "take your time", "look around".
- Do not explain mechanics. Do not tell them to observe the timeline or share a thought.
- Do not use emojis.

Good examples:
"${nickname}, the room is already moving — find a topic that matches your work and add to it."
"You're known by what you share in here, ${nickname}. That's the whole point."
"${nickname} — no photos, no likes. Just research that actually matters."

Bad examples:
"Welcome to Research Circle MJ! We're so glad you're here."
"Take a moment to observe the timeline and share a thought when you're ready."
"Hi ${nickname}, feel free to look around and settle in."`;

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
