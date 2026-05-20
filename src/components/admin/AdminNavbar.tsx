"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";

interface Props {
  nickname: string;
  role: string;
}

const TABS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/welfare", label: "Welfare", badge: "welfare" as const },
  { href: "/admin/character", label: "Character", badge: "character" as const },
  { href: "/admin/thoughts", label: "Agent Thoughts" },
  { href: "/admin/vault", label: "Vault" },
  { href: "/admin/llm", label: "LLM" },
  { href: "/admin/features", label: "Features" },
  { href: "/admin/events", label: "Events" },
];

/**
 * Admin nav with realtime badge counts on Welfare and Character tabs.
 * Subscribes to welfare_notifications and character_concerns inserts so
 * the badge ticks up the moment a flag fires — no human polling.
 */
export default function AdminNavbar({ nickname, role }: Props) {
  const pathname = usePathname();
  const [welfareCount, setWelfareCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function loadCounts() {
      const [w, c] = await Promise.all([
        supabase
          .from("welfare_notifications")
          .select("id", { count: "exact", head: true })
          .eq("resolved", false),
        supabase
          .from("character_concerns")
          .select("id", { count: "exact", head: true })
          .is("resolved_at", null),
      ]);
      if (cancelled) return;
      setWelfareCount(w.count ?? 0);
      setCharacterCount(c.count ?? 0);
    }
    loadCounts();

    const channel = supabase
      .channel("admin-nav-counts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "welfare_notifications" },
        () => loadCounts()
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "welfare_notifications" },
        () => loadCounts()
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "character_concerns" },
        () => loadCounts()
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "character_concerns" },
        () => loadCounts()
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  function badgeFor(kind: "welfare" | "character"): number {
    return kind === "welfare" ? welfareCount : characterCount;
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="w-7 h-7 rounded bg-aggilo-deep text-white text-sm font-bold flex items-center justify-center">
              A
            </span>
            <span className="font-semibold text-gray-900 text-sm">Admin</span>
          </Link>
          <span className="text-xs text-gray-400">·</span>
          <span className="text-xs text-gray-500">Sisters in Dua</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">
            {nickname} <span className="text-[10px] uppercase tracking-wide text-gray-400">{role === "founder" ? "Admin" : "Manager"}</span>
          </span>
          <Link
            href="/cluster"
            className="text-xs text-gray-600 hover:text-gray-900 underline"
          >
            Back to room
          </Link>
        </div>
      </div>
      <nav className="max-w-6xl mx-auto px-4 flex gap-1 overflow-x-auto">
        {TABS.map((t) => {
          const active = pathname === t.href;
          const count = t.badge ? badgeFor(t.badge) : 0;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                active
                  ? "border-aggilo-deep text-aggilo-deep"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              {t.label}
              {count > 0 && (
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                  t.badge === "welfare"
                    ? "bg-rose-100 text-rose-700"
                    : "bg-amber-100 text-amber-700"
                }`}>
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
