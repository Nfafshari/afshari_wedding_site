import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Mirrors the `@/*` -> `src/*` path alias in tsconfig.json. One alias, so a manual
    // entry beats pulling in a plugin to read tsconfig.
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    // Unit tests sit next to the code; whole-codebase structural tests live in tests/.
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
  },
});
