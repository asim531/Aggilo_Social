import { SISTERS_IN_DUA } from "@/lib/sage-prompt";
import ClusterPresence from "./ClusterPresence";

/**
 * Demographic restriction chips.
 *
 * Only active restrictions are shown. If a cluster has no restrictions
 * on a dimension, that dimension is silent. If ALL dimensions are open,
 * a single "Global" chip appears instead.
 *
 * This communicates expectation and identity without being a warning.
 * For members who fit: quiet affirmation. For members who don't: honest
 * context about why the room feels the way it does.
 *
 * Chip design: small, muted, pill-shaped. Not badges, not warnings.
 * They sit below the tagline so they don't compete with the cluster name.
 */
interface DemographicChip {
  label: string;
  icon: string;
  /** Tailwind colour classes for bg + text */
  color: string;
}

// Sisters in Dua Phase 0 restrictions.
// In Phase 1 these come from the cluster's AGGIL config row.
const CLUSTER_CHIPS: DemographicChip[] = [
  { label: "Women", icon: "♀", color: "bg-rose-50 text-rose-700 border-rose-200" },
];

// If no chips are defined, show a single "Global" chip.
const GLOBAL_CHIP: DemographicChip = {
  label: "Global",
  icon: "🌐",
  color: "bg-sky-50 text-sky-700 border-sky-200",
};

const chips = CLUSTER_CHIPS.length > 0 ? CLUSTER_CHIPS : [GLOBAL_CHIP];

export default function ClusterHeader() {
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-6" id="aggilo-cluster-header">
      <div className="max-w-4xl mx-auto">
        {/* ── Cluster icon + name ──────────────────────────────── */}
        <div className="flex items-start justify-between mb-1">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{SISTERS_IN_DUA.icon}</span>
            <h1 className="text-2xl font-bold text-aggilo-deep">
              {SISTERS_IN_DUA.name}
            </h1>
          </div>
        </div>

        {/* ── Tagline ──────────────────────────────────────────── */}
        <p className="text-aggilo-sage font-medium text-sm mb-2">
          {SISTERS_IN_DUA.tagline}
        </p>

        {/* ── Demographic chips — only active restrictions ─────── */}
        <div className="flex flex-wrap gap-1.5 mb-3" id="aggilo-cluster-chips">
          {chips.map((chip) => (
            <span
              key={chip.label}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${chip.color}`}
            >
              <span aria-hidden="true">{chip.icon}</span>
              {chip.label}
            </span>
          ))}
        </div>

        {/* ── Description ──────────────────────────────────────── */}
        <p className="text-gray-500 text-sm leading-relaxed">
          {SISTERS_IN_DUA.description}
        </p>

        {/* ── Live presence + members ──────────────────────────── */}
        <div className="mt-3" id="aggilo-cluster-presence">
          <ClusterPresence />
        </div>

        {/* ── Meta info ──────────────────────────────────────── */}
        {/*
         * Single warm trust line. Operational labels (e.g. "Beta Cluster")
         * removed from the member view — the URL and admin surface tell
         * that story. What members need from this row is "this room is
         * hosted, the references it uses are verified" — a quiet trust
         * signal, not a stack of equally-weighted badges.
         */}
        <div className="mt-4 text-xs text-gray-400">
          <span>Hosted community · verified sources only</span>
        </div>
      </div>
    </div>
  );
}
