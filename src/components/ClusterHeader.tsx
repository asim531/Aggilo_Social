import { SISTERS_IN_DUA } from "@/lib/sage-prompt";
import ClusterPresence from "./ClusterPresence";

export default function ClusterHeader() {
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-6">
      <div className="max-w-4xl mx-auto">
        {/* ── Cluster icon + name ──────────────────────────────── */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{SISTERS_IN_DUA.icon}</span>
            <h1 className="text-2xl font-bold text-aggilo-deep">
              {SISTERS_IN_DUA.name}
            </h1>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs font-medium px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Women Only
          </div>
        </div>

        {/* ── Tagline ──────────────────────────────────────────── */}
        <p className="text-aggilo-sage font-medium text-sm mb-1">
          {SISTERS_IN_DUA.tagline}
        </p>

        {/* ── Description ──────────────────────────────────────── */}
        <p className="text-gray-500 text-sm leading-relaxed">
          {SISTERS_IN_DUA.description}
        </p>

        {/* ── Live presence + members ──────────────────────────── */}
        <div className="mt-3">
          <ClusterPresence />
        </div>

        {/* ── Meta info ──────────────────────────────────────── */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-gray-400">
          <div className="flex items-center gap-4">
            <span>Beta Cluster</span>
            <span>Hosted community</span>
            <span>Verified sources only</span>
          </div>
        </div>
      </div>
    </div>
  );
}
