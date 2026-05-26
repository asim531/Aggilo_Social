import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.role !== "founder" && profile.role !== "manager")) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const { data: notifications } = await supabase
      .from("welfare_notifications")
      .select("*, posts(content, created_at, profiles(nickname))")
      .eq("resolved", false)
      .order("created_at", { ascending: false })
      .limit(50);

    return NextResponse.json({ notifications: notifications || [] });
  } catch (error) {
    console.error("Notifications error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { notificationId, action } = await request.json();

    if (!notificationId || !action) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.role !== "founder" && profile.role !== "manager")) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    if (action === "resolve") {
      await supabase
        .from("welfare_notifications")
        .update({ resolved: true, resolved_by: user.id, resolved_at: new Date().toISOString() })
        .eq("id", notificationId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Notification action error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
