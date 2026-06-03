import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { CLUSTER_ID } from "@/lib/cluster";
import { llmCall } from "@/lib/llm";

// Minimal API for cron/trigger to generate a tip for members
export async function POST() {
  const supabase = createAdminClient();
  
  // Find a user who hasn't posted recently (last 48 hours) but is active,
  // or a user who has posted but hasn't received a tip recently.
  // For simplicity, we just fetch one user who hasn't received a tip in 24 hours.
  const { data: users, error: userError } = await supabase
    .from("profiles")
    .select("id, nickname")
    .eq("cluster_id", CLUSTER_ID)
    .limit(10);
    
  if (!users || users.length === 0) {
    return NextResponse.json({ message: "No users found" });
  }

  // We will evaluate the first user who doesn't have a recent tip
  let targetUser = null;
  for (const user of users) {
    const { data: recentTips } = await supabase
      .from("clio_tip_log")
      .select("id")
      .eq("user_id", user.id)
      .eq("cluster_id", CLUSTER_ID)
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
      
    if (!recentTips || recentTips.length === 0) {
      targetUser = user;
      break;
    }
  }

  if (!targetUser) {
    return NextResponse.json({ message: "No users eligible for tips at this time." });
  }

  // Generate tip
  try {
    const systemPrompt = `You are Clio, an AI companion in the Research Circle MJ space.
You are evaluating whether to send a private tip to member: ${targetUser.nickname}.
Their recent activity indicates they haven't posted in 48 hours. Generate a short, direct nudge (max 2 sentences) encouraging them to share something research-related — a draft, a question, a document, or an observation.
Be warm but not sentimental. Do not explain why posting matters, just invite the next step. Frame it around the work, not around social obligation.`;

    const result = await llmCall({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Generate the tip now." }
      ],
      temperature: 0.7
    });

    const tipContent = result.content;
    if (!tipContent) {
      throw new Error("Empty tip generated");
    }

    // Insert tip
    const tipRow = {
      cluster_id: CLUSTER_ID,
      user_id: targetUser.id,
      trigger_type: "no_post_48h",
      tip_content: tipContent.trim(),
      tip_delivered_at: new Date().toISOString(),
      member_acted: null,
      suppression_reason: null,
    };

    const { error: insertError } = await supabase
      .from("clio_tip_log")
      .insert(tipRow);
      
    if (insertError) {
      console.error("Failed to insert tip", insertError);
      return NextResponse.json({ error: "DB Error" }, { status: 500 });
    }

    return NextResponse.json({ success: true, user: targetUser.nickname, tip: tipContent });
  } catch (error) {
    console.error("Tip generation error:", error);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
