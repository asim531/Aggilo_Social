/**
 * Tailwind config — Research Circle MJ.
 *
 * Theme: "Reading Room" — warm wood, parchment, leather, and deep
 * scholarly accents. The palette evokes a well-appointed college
 * library where ideas feel permanent and documents feel at home.
 *
 * Six accents only:
 *   parchment    — warm neutral surfaces (aged paper under lamplight)
 *   leather      — Clio (saddle brown, scholarly warmth)
 *   forest       — Sage (deep teal, old book binding)
 *   brick        — welfare handoff (muted, safety floor)
 *   ink          — primary text (warm dark, like old book ink)
 *   stone        — chrome (navbar, dividers, secondary text)
 *
 * Do not introduce a seventh hue.
 */

import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        husl: {
          // Page background — warm parchment, like aged paper under lamplight
          surface: "#f5f0e6",
          // Card surface — clean cream, slightly warm
          card: "#faf7f2",
          // Primary text — deep warm brown-black, like old book ink
          ink: "#2d2419",
          // Secondary text — warm stone, like library shelving
          muted: "#7a6e5e",
          // Clio's surfaces — saddle brown leather, scholarly warmth
          clio: "#8B5A2B",
          clioSoft: "#f0e6d8",
          // Sage's surfaces — deep forest teal, like old book binding
          sage: "#1e4d4b",
          sageSoft: "#e0ebe9",
          // Welfare handoff — muted brick red, used sparingly
          welfare: "#c44d56",
          welfareSoft: "#f5e0e2",
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
