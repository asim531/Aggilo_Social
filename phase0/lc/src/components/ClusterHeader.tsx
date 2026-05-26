/**
 * Cluster header — Long Conversation.
 *
 * The room's identity strip, sitting just below the Navbar. Shows the
 * cluster name (again, as a heading not a label), the tagline, and the
 * demographic chips. Sage's empty-room presence is rendered separately
 * by the feed — this header is just identity.
 */

import { CLUSTER } from "@/lib/cluster";
import ClusterPresence from "./ClusterPresence";

export default function ClusterHeader() {
  return (
    <header className="bg-lc-card border-b border-stone-200">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-lc-muted mb-2">
              A cluster on Aggilo · Beta
            </p>
            <h1 className="text-2xl font-semibold text-lc-ink mb-1">
              {CLUSTER.displayName}
            </h1>
            <p className="text-sm text-lc-muted mb-4">{CLUSTER.tagline}</p>
            <ClusterPresence />
          </div>
          
          <button
            onClick={() => {
              if (typeof navigator !== "undefined" && navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href);
                alert("Room link copied to clipboard!");
              }
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-xs font-medium text-lc-ink transition-colors mr-14 min-[800px]:mr-0"
            title="Share this room"
          >
            <svg
              className="w-4 h-4 text-lc-clio"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share
          </button>
        </div>
      </div>
    </header>
  );
}
