/**
 * TAILWIND CSS CONFIGURATION
 * --------------------------
 * Aggilo uses a warm, grounded color palette.
 * Primary: deep indigo (#1e1b4b) — trust, depth
 * Accent: warm amber (#f59e0b) — energy, wisdom
 * Background: soft stone (#fafaf9) — clean, breathable
 *
 * These can be customized later to match Aggilo's brand.
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
        /* Aggilo brand colors — adjust as needed */
        aggilo: {
          deep: "#1e1b4b",     /* primary backgrounds, headers */
          mid: "#312e81",      /* hover states, secondary */
          light: "#e0e7ff",    /* subtle highlights */
          accent: "#f59e0b",   /* CTAs, Sage indicator */
          sage: "#059669",     /* Sage's signature color */
          surface: "#fafaf9",  /* page background */
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        arabic: [
          "var(--font-amiri)",
          "var(--font-scheherazade)",
          "Amiri",
          "Scheherazade New",
          "Noto Naskh Arabic",
          "serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
