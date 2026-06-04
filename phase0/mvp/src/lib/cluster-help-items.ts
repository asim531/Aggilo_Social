/**
 * Cluster help items — single source of truth for the "show me around"
 * tour and any future help affordances.
 *
 * Each item names a surface in the cluster page, the CSS selector for
 * its anchor, and a one- or two-sentence description. Copy is
 * deterministic by design (see ClioTour rationale).
 *
 * Platform-baseline list — every cluster gets these. Workshop-driven
 * items are not added here; this is the floor that ships with every
 * room.
 */

import type { TourStep } from "@/components/ClioTour";

export const PLATFORM_HELP_ITEMS: TourStep[] = [
  {
    label: "Live presence",
    selector: "#aggilo-cluster-presence",
    description:
      "Who's online now and how many sisters have joined this week.",
  },
  {
    label: "Cluster restrictions",
    selector: "#aggilo-cluster-chips",
    description: "Who this room is for — gender, location, language.",
  },
  {
    label: "Pinned anchor",
    selector: "#aggilo-pinned-anchor",
    description: "The room's founding statement at the top.",
  },
  {
    label: "Posts & timeline",
    selector: "#aggilo-cluster-timeline",
    description:
      "The conversation. Long-press any post to react, share, or report.",
  },
  {
    label: "Compose bar",
    selector: "#aggilo-compose-bar",
    description: "Where you share what's on your heart.",
  },
  {
    label: "@Sage feature",
    selector: "#aggilo-compose-bar",
    description:
      "Type @Sage in the compose bar and ask a question — she replies when she has something verified.",
  },
  {
    label: "Sage's posts",
    selector: ".sage-post",
    description:
      "Sage anchors the room and shares verified references from Quran and authentic Sunnah.",
  },
  {
    label: "Room Workshop",
    selector: "#aggilo-room-workshop",
    description: "What Clio and I are building for this room.",
  },
  {
    label: "Myself (Clio)",
    selector: ".clio-fab, .clio-fab-cluster",
    description: "I'm always here. Tap the avatar to chat anytime.",
  },
];
