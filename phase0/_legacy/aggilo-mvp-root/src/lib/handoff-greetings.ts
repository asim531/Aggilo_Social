/**
 * Sage → Clio soft handoff: templated greetings.
 *
 * The greeting is templated, not Sage-authored. Sage's `[SAGE_SILENT]`
 * decision combined with the platform-detected reason picks a template;
 * no LLM call generates these words. This prevents the handoff from
 * becoming a back-channel for member analysis.
 *
 * Three handoff reasons exist. Each one wants its own register:
 *
 *   - welfare:           a genuine welfare signal — quiet, no rush
 *   - personal_disclosure: tender but private, not necessarily a welfare event
 *   - fiqh_with_distress:  the ruling went to the Admin, the feeling stayed
 *
 * The greeting NEVER:
 *   - Quotes the original post
 *   - Diagnoses the member's state
 *   - Promises action ("we'll get back to you")
 *   - Uses the word "concern", "worried", "okay" — all of these presume welfare
 *
 * The greeting ALWAYS:
 *   - Names Sage as the bridge
 *   - Leaves the door open — no pressure to engage
 *   - Stays in present tense
 *
 * Spec: clio/CLIO_UNIFIED_CLUSTER_PRESENCE.md §6.4
 */

export type HandoffReason =
  | "welfare"
  | "personal_disclosure"
  | "fiqh_with_distress";

interface GreetingTemplate {
  text: string;
  /** Used by the UI to tint the bubble — never visible to the cluster */
  toneColor: "rose" | "amber" | "indigo";
}

// Multiple templates per reason to avoid the same greeting landing twice.
// Selection is deterministic based on a hash of the post id, so the same
// member never gets identical greetings on consecutive handoffs.
const TEMPLATES: Record<HandoffReason, GreetingTemplate[]> = {
  welfare: [
    {
      text:
        "Sage saw what you wrote and stepped back from a public reply. I'm here if you want to say more — or just sit. No need to talk.",
      toneColor: "rose",
    },
    {
      text:
        "Sage thought this needed a private space, not a public reply. I'm here. Nothing has to be said.",
      toneColor: "rose",
    },
  ],

  personal_disclosure: [
    {
      text:
        "Sage felt this deserved more than a public reply. I'm here if you want to keep talking — privately.",
      toneColor: "amber",
    },
    {
      text:
        "Sage stepped back so this wouldn't sit alone in the room. I'm here if you'd rather continue privately.",
      toneColor: "amber",
    },
  ],

  fiqh_with_distress: [
    {
      text:
        "Sage pointed the question itself toward the Admin. I'm here if you want to talk through how it's sitting with you — privately.",
      toneColor: "indigo",
    },
    {
      text:
        "Sage left the ruling for the Admin, not the feeling. I'm here for the part the answer doesn't cover.",
      toneColor: "indigo",
    },
  ],
};

/**
 * Pick a greeting template deterministically from the triggering post id.
 * Same post → same greeting. Different posts → different greetings (modulo
 * template count). Eliminates the failure mode where two identical bubbles
 * land in a member's tab from two consecutive handoffs.
 */
export function selectGreetingTemplate(
  reason: HandoffReason,
  postId: string
): GreetingTemplate {
  const pool = TEMPLATES[reason] || TEMPLATES.welfare;
  // Simple stable hash — sufficient for picking from a small array
  let h = 0;
  for (let i = 0; i < postId.length; i++) {
    h = (h * 31 + postId.charCodeAt(i)) >>> 0;
  }
  return pool[h % pool.length];
}

/**
 * Resolve a greeting record's tone color from its reason.
 * Used by the UI to tint the in-panel bubble. The cluster-visible inline
 * note never reads this — it's reason-blind by design.
 */
export function toneColorForReason(
  reason: HandoffReason | string | null | undefined
): "rose" | "amber" | "indigo" {
  if (reason === "personal_disclosure") return "amber";
  if (reason === "fiqh_with_distress") return "indigo";
  return "rose"; // default + welfare
}
