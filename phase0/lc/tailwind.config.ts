/**
 * Tailwind config — Long Conversation.
 *
 * The palette is intentionally narrow. Long Conversation is a
 * text-only space where words are the entire presence. The visual
 * design supports that — it does not compete with it.
 *
 * Six accents only:
 *   stone        — neutral surfaces (page background, cards)
 *   amber        — Clio (warmth, presence, individual attention)
 *   teal         — Sage (depth, the room's quality)
 *   rose         — welfare handoff (lowest saturation, safety floor)
 *   indigo       — admin / platform surfaces
 *   slate        — chrome (navbar, dividers, secondary text)
 *
 * Do not introduce a seventh hue. If a new surface needs distinction,
 * use intensity (200/400/600/800), not a new colour.
 */

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        lc: {
          // Page background — soft warm neutral, not pure white
          surface: "#fafaf9",
          // Card surface — slightly elevated from the page
          card: "#ffffff",
          // Primary text on light surfaces
          ink: "#1c1917",
          // Secondary text — readable but quiet
          muted: "#57534e",
          // Clio's surfaces (warm amber, intimacy register)
          clio: "#d97706",
          clioSoft: "#fef3c7",
          // Sage's surfaces (teal — the quality of the room)
          sage: "#0d9488",
          sageSoft: "#ccfbf1",
          // Welfare handoff (rose — used sparingly)
          welfare: "#e11d48",
          welfareSoft: "#ffe4e6",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        serif: ["Iowan Old Style", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
