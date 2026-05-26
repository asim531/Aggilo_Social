/**
 * Cluster header — Long Conversation.
 *
 * The room's identity strip, sitting just below the Navbar. Shows the
 * cluster name (again, as a heading not a label), the tagline, and the
 * demographic chips. Sage's empty-room presence is rendered separately
 * by the feed — this header is just identity.
 */

import { CLUSTER } from "@/lib/cluster";

export default function ClusterHeader() {
  return (
    <header className="bg-lc-card border-b border-stone-200">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <p className="text-xs uppercase tracking-[0.2em] text-lc-muted mb-2">
          A cluster on Aggilo · Beta
        </p>
        <h1 className="text-2xl font-semibold text-lc-ink mb-1">
          {CLUSTER.displayName}
        </h1>
        <p className="text-sm text-lc-muted mb-3">{CLUSTER.tagline}</p>

        {/* Demographic chips — currently India · 22–32. Source: CLUSTER.demographicChips
            in the canonical identity, but lc/lib/cluster.ts holds a smaller subset. */}
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-amber-50 text-amber-800 border border-amber-200">
            <span className="mr-1">📍</span>India
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-stone-50 text-stone-700 border border-stone-200">
            22–32
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-stone-50 text-stone-700 border border-stone-200">
            English
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-stone-50 text-stone-700 border border-stone-200">
            Text only
          </span>
        </div>
      </div>
    </header>
  );
}
