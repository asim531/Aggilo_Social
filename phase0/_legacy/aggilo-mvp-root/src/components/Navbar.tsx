"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";

interface NavbarProps {
  displayName: string;
}

export default function Navbar({ displayName }: NavbarProps) {
  const router = useRouter();
  const [showAdmin, setShowAdmin] = useState(false);

  // Show "Admin" link only for founders/managers. Reads the profile once
  // on mount and caches the answer for the session — RLS still enforces
  // access on /admin pages, this is just nav UX.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (cancelled) return;
      if (data && (data.role === "founder" || data.role === "manager")) {
        setShowAdmin(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <nav className="sticky top-0 z-50 bg-aggilo-deep text-white shadow-md">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <a
          href="https://aggilo.in"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          title="Visit Aggilo"
        >
          <span className="text-aggilo-accent text-xl font-bold">A</span>
          <span className="font-semibold tracking-tight">Aggilo</span>
        </a>

        <div className="flex items-center gap-4">
          <Link
            href="/cluster/features"
            className="text-sm text-white/70 hover:text-white transition-colors"
            title="Tools we run for this room and features you can vote on"
          >
            Workshop
          </Link>
          <span className="text-sm text-white/70">{displayName}</span>
          {showAdmin && (
            <Link
              href="/admin"
              className="text-sm text-aggilo-accent hover:underline"
              title="Admin dashboard"
            >
              Admin
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="text-sm text-white/50 hover:text-white transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
