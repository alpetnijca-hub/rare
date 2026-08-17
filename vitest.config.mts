import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Löst die "@/..."-Pfade aus tsconfig.json auf.
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globals: true,
    setupFiles: ["tests/setup.ts"],
    // Datenbanktests dürfen sich nicht gegenseitig ins Gehege kommen.
    fileParallelism: false,
    testTimeout: 30_000,
  },
});
