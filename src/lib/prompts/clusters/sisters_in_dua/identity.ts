/**
 * Sisters in Dua — cluster identity.
 *
 * The MVP premium cluster. Phase 0's first live cluster. Used to test
 * and refine the platform before any second partner cluster signs.
 *
 * This file is the ONLY place Sisters-in-Dua-specific vocabulary lives.
 * Sage's character, Clio's character, and the platform safety floor
 * live in `prompts/platform/`. The cluster's own Sage system prompt and
 * Clio context block live alongside this file (`sage.ts`, `clio.ts`)
 * and stitch the platform character with the identity below.
 */

import type { ClusterIdentity } from "../../cluster-types/types";

export const SISTERS_IN_DUA_IDENTITY: ClusterIdentity = {
  id: "the_single_source", // legacy DB cluster_id — kept stable for V3.x continuity
  type: "premium",
  displayName: "Sisters in Dua",
  tagline: "Faith lived, discussed, and held together — in Hyderabad.",
  description:
    "A community for Muslim women in Hyderabad navigating faith in real life. Grounded in Quran and authentic Sunnah. Guided by practitioners and scholars.",
  icon: "🤲",
  primaryLanguage: "en",
  memberNoun: "sister",
  memberNounPlural: "sisters",
  collectiveNoun: "this room",
  authorityNoun: "Admin",
  hasDemographicRestrictions: true,
  demographicChips: [
    {
      label: "Hyderabad",
      icon: "📍",
      color: "bg-orange-50 text-orange-700 border-orange-200",
    },
    {
      label: "Women",
      icon: "♀",
      color: "bg-rose-50 text-rose-700 border-rose-200",
    },
  ],
  seedPosts: [
    `This room is for sisters across Hyderabad to talk about what it actually means to stay close to Allah — through difficulty, doubt, routine, and real life.

Every reference that appears here comes from verified sources: the Quran, the six major Sunni hadith collections (Sahih and Hasan grades only), and selected Islamic knowledge sources. Nothing fabricated. Nothing weak.

The Admin and Managers hold guidance authority in this community. For rulings or fiqh, they are who you need — or a scholar you trust.

This is not a classroom or a fatwa service. It is a space where faith is lived, discussed, and held together.`,
  ],
};
