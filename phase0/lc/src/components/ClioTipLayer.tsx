"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { CLUSTER_ID } from "@/lib/cluster";
import type { ClioTipLogRow } from "@/lib/types";

export default function ClioTipLayer({ userId }: { userId: string }) {
  const [activeTip, setActiveTip] = useState<ClioTipLogRow | null>(null);

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
        setActiveTip(data as ClioTipLogRow);
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
            setActiveTip(payload.new as ClioTipLogRow);
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("clio-tip-inserted", handleLocalInsert);
    };
  }, [userId]);

  if (!activeTip) return null;

  async function handleDismiss() {
    if (!activeTip) return;
    const tipId = activeTip.id;
    setActiveTip(null); // optimistic hide

    const supabase = createClient();
    await supabase
      .from("clio_tip_log")
      .update({ member_acted: true })
      .eq("id", tipId);
  }

  return (
    <div className="fixed bottom-24 right-4 z-[90] max-w-sm animate-in slide-in-from-bottom-8 fade-in duration-500">
      <div className="relative bg-lc-card border border-stone-200 shadow-xl rounded-xl p-4 pl-12 overflow-hidden">
        {/* Accent left border */}
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-lc-clio" />
        
        {/* Clio icon */}
        <div className="absolute left-3 top-4 w-6 h-6 rounded-full overflow-hidden bg-amber-100 flex items-center justify-center">
          <img src="/characters/clio.png" alt="Clio" className="w-full h-full object-cover" />
        </div>
        
        <p className="text-sm text-lc-ink leading-relaxed pr-6">
          {activeTip.tip_content}
        </p>
        
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-stone-400 hover:text-stone-600 transition-colors focus:outline-none"
          aria-label="Dismiss tip"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
