"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";
import { CLUSTER_ID } from "@/lib/cluster";

export default function ClioTipLayer({ userId }: { userId: string }) {
  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();

    async function checkTips() {
      const { data } = await supabase
        .from("clio_tip_log")
        .select("*")
        .eq("cluster_id", CLUSTER_ID)
        .eq("user_id", userId)
        .is("member_acted", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        window.dispatchEvent(
          new CustomEvent("clio-tip-available", {
            detail: { tip: data.tip_content, tipId: data.id },
          })
        );
      }
    }

    checkTips();

    // Fallback: Listen to custom event for manual tip insertions
    const handleLocalInsert = () => checkTips();
    window.addEventListener("clio-tip-inserted", handleLocalInsert);

    // Subscribe to new tips landing in realtime
    const channel = supabase
      .channel("clio-tips")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "clio_tip_log",
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          if (payload.new && payload.new.cluster_id === CLUSTER_ID) {
            window.dispatchEvent(
              new CustomEvent("clio-tip-available", {
                detail: { tip: payload.new.tip_content, tipId: payload.new.id },
              })
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("clio-tip-inserted", handleLocalInsert);
    };
  }, [userId]);

  // This component no longer renders visible UI — tips are delivered
  // to ClioFab via custom events and displayed inside the chat panel.
  return null;
}
