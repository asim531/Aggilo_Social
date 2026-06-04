/**
 * Vitest configuration for Aggilo MVP.
 *
 * Runs in Node environment (not jsdom) because the tests cover pure
 * TypeScript business logic — no DOM, no React. If component tests are
 * added later, add a separate workspace entry with environment: 'jsdom'.
 */
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/__tests__/**/*.test.ts"],
    globals: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
