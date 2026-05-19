"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";

interface NavbarProps {
  displayName: string;
}

export default function Navbar({ displayName }: NavbarProps) {
  const router = useRouter();

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
          <span className="text-sm text-white/70">{displayName}</span>
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
